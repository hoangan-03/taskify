import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepicker } from '@angular/material/datepicker';
import { NgxMaterialTimepickerModule } from 'ngx-material-timepicker';
import { HttpClient } from '@angular/common/http';
import { MaterialModule } from '../../../shared';
import { InfoIconComponent } from '../../../components';
import { TaskService } from '../../services/task.service';
import { environment } from '../../../../environments/environment';
import { User, Event, Color, Task } from '../../models/task.model';

@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    InfoIconComponent,
    NgxMaterialTimepickerModule,
    MatDatepicker,
  ],
  templateUrl: './calendar.component.html',
  providers: [provideNativeDateAdapter(), DatePipe],
})
export class CalendarComponent {
  baseUrl = environment.baseUrl;
  constructor(
    private http: HttpClient,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {}
  hoveredEvent: any = null;
  events: Event[] = [];
  weeks: { start: Date; end: Date }[] = [];
  currentWeekIndex: number = 0;
  selectedUsers: User[] = [];
  usersList: User[] = [];
  Color = Color;
  eventNameControl = new FormControl('');
  eventDescriptionControl = new FormControl('');
  locationControl = new FormControl('');
  startTimeControl = new FormControl('');
  endTimeControl = new FormControl('');
  taskControl = new FormControl('');
  taskColorControl: string = '';
  colors: string[] = [
    'blue',
    'green',
    'red',
    'purple',
    'yellow',
    'gray',
    'pink',
  ];
  showModal: boolean = false;
  currentDate: Date = new Date();
  currentHour: string = '';
  monthControl = new FormControl(new Date(2024, 0, 1));

  openModal(date: Date, hour: string) {
    this.showModal = true;
    this.currentDate = date;
    this.currentHour = hour;
  }
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }
  async submitForm() {
    try {
      const selectedColor = this.getColorEnumValue(this.taskColorControl);
      function convertTo24HourFormat(
        timeControl: FormControl<string | null> | string | null
      ): string {
        let time: string | null;
        if (timeControl instanceof FormControl) {
          time = timeControl.value;
        } else {
          time = timeControl;
        }

        if (!time) {
          return '00:00:00';
        }

        const [timePart, modifier] = time.split(' ');
        let [hours, minutes] = timePart.split(':');

        if (hours === '12') {
          hours = '00';
        }

        if (modifier === 'PM') {
          hours = (parseInt(hours, 10) + 12).toString();
        }

        return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      }
      const formData = {
        eventName: this.eventNameControl.value,
        description: this.eventDescriptionControl.value ?? '',
        color: selectedColor,
        date: this.datePipe.transform(this.currentDate, 'yyyy-MM-dd'),
        startTime: convertTo24HourFormat(this.startTimeControl),
        endTime: convertTo24HourFormat(this.endTimeControl),
        location: this.locationControl.value ?? '',
        taskId: this.taskControl.value,
        creatorId: 1,
        eventUsers: this.selectedUsers.map((user) => ({
          userId: user.userId,
        })),
      };
      const jsonString = JSON.stringify(formData);
      this.http.post(`${this.baseUrl}/api/events`, formData).subscribe({
        next: (response) => {
          this.closeModal();
          this.fetchEvents();
          console.log('Response:', formData);
        },
        error: (error) => {
          console.error('Error:', error);
          console.log('Form Data:', formData);
        },
      });
    } catch (error) {
      console.log('Form error:', error);
    }
  }
  tasks: Task[] = [];
  fetchTasks(): void {
    this.taskService.getTasks().subscribe(
      (response: any) => {
        if (response && response.$values) {
          this.tasks = response.$values.map((task: any) => {
            return {
              ...task,
              taskTags: task.taskTags.$values,
              comments: task.comments.$values,
              attachments: task.attachments.$values,
            };
          });
          this.cdr.detectChanges();
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching tasks', error);
      }
    );
  }
  fetchEvents(): void {
    this.taskService.getEvents().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.events = response.$values.map((event: any) => ({
            ...event,
          }));
          this.cdr.detectChanges();
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching Events', error);
      }
    );
  }
  public getColorEnumValue(colorString: string): Color {
    switch (colorString.toLowerCase()) {
      case 'blue':
        return Color.blue;
      case 'green':
        return Color.green;
      case 'red':
        return Color.red;
      case 'purple':
        return Color.purple;
      case 'yellow':
        return Color.yellow;
      case 'gray':
        return Color.gray;
      case 'pink':
        return Color.pink;
      default:
        throw new Error(`Unknown color: ${colorString}`);
    }
  }
  fetchUsers(): void {
    this.taskService.getUsers().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.usersList = response.$values.map((user: any) => ({
            userId: user.userId,
            fullName: user.fullName,
          }));
          this.cdr.detectChanges();
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching users', error);
      }
    );
  }
  getEventUsersNames(eventUsers: any[]): string {
    console.log('The event users', eventUsers);
    if (!eventUsers) {
      return '';
    }
    return eventUsers.map((user) => user.fullName).join(', ');
  }
  getAssignerNameById(id: number): string {
    const user = this.usersList.find((user) => user.userId === id);
    console.log('The user', user?.fullName);
    return user ? user.fullName : 'Unknown';
  }

  getRowSpan(task: any): number {
    const startHour = this.convertTo24HourFormat(task.startTime);
    const endHour = this.convertTo24HourFormat(task.endTime);
    return endHour - startHour;
  }

  convertTo24HourFormat(time: string): number {
    let [hours, minutes] = time.split(':').map(Number);
    return hours;
  }
  getFullDayName(dayAbbreviation: string): string {
    const dayMap: { [key: string]: string } = {
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    };
    return dayMap[dayAbbreviation] || dayAbbreviation;
  }

  generateWeeks(): void {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');
    let current = startDate;
    while (current <= endDate) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      this.weeks.push({ start: weekStart, end: weekEnd });
      current.setDate(current.getDate() + 7);
    }
  }

  previousWeek(): void {
    if (this.currentWeekIndex > 0) {
      this.currentWeekIndex--;
      this.saveCurrentWeekIndex();
    }
  }

  nextWeek(): void {
    if (this.currentWeekIndex < this.weeks.length - 1) {
      this.currentWeekIndex++;
      this.saveCurrentWeekIndex();
    }
  }

  isDateInCurrentWeek(date: Date | undefined): boolean {
    if (!date) {
      return false;
    }
    const currentWeek = this.weeks[this.currentWeekIndex];
    return date >= currentWeek.start && date <= currentWeek.end;
  }

  getDateObject(dateString: string): Date {
    return new Date(dateString);
  }

  getDayNameFromDate(date: Date): string {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return daysOfWeek[date.getDay()];
  }
  days = [
    { day: 1, name: 'Mon', date: new Date() },
    { day: 2, name: 'Tue', date: new Date() },
    { day: 3, name: 'Wed', date: new Date() },
    { day: 4, name: 'Thu', date: new Date() },
    { day: 5, name: 'Fri', date: new Date() },
    { day: 6, name: 'Sat', date: new Date() },
    { day: 7, name: 'Sun', date: new Date() },
  ];
  hours: string[] = [
    '00:00:00',
    '01:00:00',
    '02:00:00',
    '03:00:00',
    '04:00:00',
    '05:00:00',
    '06:00:00',
    '07:00:00',
    '08:00:00',
    '09:00:00',
    '10:00:00',
    '11:00:00',
    '12:00:00',
    '13:00:00',
    '14:00:00',
    '15:00:00',
    '16:00:00',
    '17:00:00',
    '18:00:00',
    '19:00:00',
    '20:00:00',
    '21:00:00',
    '22:00:00',
    '23:00:00',
  ];
  saveCurrentWeekIndex(): void {
    localStorage.setItem('currentWeekIndex', this.currentWeekIndex.toString());
  }

  loadCurrentWeekIndex(): void {
    if (typeof localStorage !== 'undefined') {
      const storedIndex = localStorage.getItem('currentWeekIndex');
      if (storedIndex !== null) {
        this.currentWeekIndex = parseInt(storedIndex, 10);
      }
    }
  }
  selectMonth(): void {
    const monthPicker = document.querySelector(
      '.month-picker .mat-datepicker-toggle'
    ) as HTMLElement;
    if (monthPicker) {
      monthPicker.click();
    }
  }

  chosenMonthHandler(
    normalizedMonth: Date,
    datepicker: MatDatepicker<Date>
  ): void {
    const firstDayOfMonth = new Date(
      normalizedMonth.getFullYear(),
      normalizedMonth.getMonth(),
      1
    );
    const lastDayOfMonth = new Date(
      normalizedMonth.getFullYear(),
      normalizedMonth.getMonth() + 1,
      0
    );

    this.weeks = [];
    let current = firstDayOfMonth;
    while (current <= lastDayOfMonth) {
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6);
      this.weeks.push({ start: weekStart, end: weekEnd });
      current.setDate(current.getDate() + 7);
    }

    this.currentWeekIndex = 0;
    this.saveCurrentWeekIndex();
    this.monthControl.setValue(normalizedMonth);
    datepicker.close();
  }
  ngOnInit(): void {
    this.fetchEvents();
    this.fetchTasks();
    this.generateWeeks();
    this.fetchUsers();
    this.loadCurrentWeekIndex();
  }
}
