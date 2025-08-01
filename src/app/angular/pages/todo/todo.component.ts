import {
  Component,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  model,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  Validators,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { provideNativeDateAdapter } from '@angular/material/core';
import {
  DragDropModule,
  CdkDragDrop,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { HttpClient } from '@angular/common/http';
import { TaskService } from '../../services/task.service';
import { environment } from '../../../../environments/environment';
import {
  TaskState,
  Task,
  AttachmentType,
  CommentState,
  Comment,
  Project,
  User,
} from '../../models/task.model';
import { TaskItemComponent, UpdateTaskModalComponent, AddTaskModalComponent } from '../../../components';
import {MaterialModule, MatAutocompleteSelectedEvent, MatChipInputEvent } from '../../../shared/material.module';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    DragDropModule,
    TaskItemComponent,
    UpdateTaskModalComponent,
    AddTaskModalComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter(), DatePipe],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.scss',
})
export class TodoComponent {
  userList: any[] = [];
  constructor(
    private http: HttpClient,
    private taskService: TaskService,
    private cdr: ChangeDetectorRef,
    private datePipe: DatePipe
  ) {}
  readonly announcer = inject(LiveAnnouncer);
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly currentTag = model('');
  readonly tags = signal(['Daily']);
  readonly allTags: string[] = [
    'Daily',
    'Weekly',
    'Monthly',
    'Quarterly',
    'Annual',
    'Urgent',
    'High Priority',
    'Medium Priority',
    'Low Priority',
    'Routine',
    'Ad-hoc',
    'Maintenance',
    'Project-Based',
    'Critical',
    'Optional',
    'Mandatory',
    'Short-term',
    'Long-term',
    'One-time',
    'Follow-up',
    'Scheduled',
    'Unscheduled',
    'Team',
    'Individual',
    'Client-related',
    'Internal',
    'Training',
    'Development',
    'Research',
    'Testing',
    'Deployment',
    'Review',
    'Documentation',
    'Reporting',
    'Planning',
    'Evaluation',
    'Support',
    'Operational',
    'Strategic',
    'Emergency',
    'Preventive',
    'Corrective',
    'Improvement',
    'Monitoring',
    'Supervisory',
    'Audit',
    'Administrative',
    'Marketing',
    'Sales',
    'Inventory',
    'Procurement',
    'Quality Assurance',
    'Networking',
    'Configuration',
    'Security',
    'Backup',
    'Recovery',
    'Installation',
    'Upgrade',
    'Migration',
    'Integration',
    'Troubleshooting',
    'Optimization',
    'Inspection',
  ];
  readonly categories: string[] = [
    'Daily',
    'Development',
    'Maintenance',
    'Individual',
  ];
  trackByTag(index: number, tag: string): string {
    return tag;
  }
  trackByCategory(index: number, category: string): string {
    return `${index}-${category}`;
  }
  readonly filteredTags = computed(() => {
    const currentTag = this.currentTag().toLowerCase();
    return currentTag
      ? this.allTags.filter((tag) => tag.toLowerCase().includes(currentTag))
      : this.allTags.slice();
  });
  showUpdateModal = false;
  assignerUpdateControl = new FormControl('', [Validators.required]);
  assigneeUpdateControl = new FormControl('', [Validators.required]);
  updateTaskNameControl = new FormControl('', Validators.required);
  updateTaskDescriptionControl = new FormControl('');
  updateDeadlineControl = new FormControl('', Validators.required);
  updateCategoryControl = new FormControl<string[]>([], Validators.required);
  updateProjectControl = new FormControl('', Validators.required);
  updateFileControl = new FormControl('');
  fileNameUpdateControl = new FormControl('', [Validators.required]);
  controlUpdateFiles: File[] = [];
  selectedUpdateFiles: { name: string; type: number }[] = [];
  currentUpdateId: number = 0;

  filteredCate: string[] = [];
  filteredPro: string = '';
  filteredTasks: Task[] = [];
  filteredDeadline: Date | null = null;
  filteredTasksAssignedToCurrentUser: Task[] = [];

  applyFilters(): void {
    this.filteredTasks = this.filterTasks(this.sortTasks(this.tasks));
    this.filteredTasksAssignedToCurrentUser = this.filterTasks(
      this.sortTasks(this.tasksAssignedToCurrentUser)
    );
    this.cdr.detectChanges();
  }

  filterTasks(tasks: Task[]): Task[] {
    return tasks.filter((task) => {
      const matchesCategory = this.filteredCate.length
        ? Array.isArray(task.type)
          ? task.type.some((type) => this.filteredCate.includes(type))
          : this.filteredCate.includes(task.type)
        : true;
      const matchesProject = this.filteredPro
        ? task.projectName === this.filteredPro
        : true;
      const matchesDeadline = this.filteredDeadline
        ? new Date(task.deadline) <= this.filteredDeadline
        : true;
      return matchesCategory && matchesProject && matchesDeadline;
    });
  }

  openUpdateModal(id: number) {
    this.showUpdateModal = true;
    this.currentUpdateId = id;
    const currentTask = this.tasks.find(
      (task) => task.id === this.currentUpdateId
    );

    if (currentTask) {
      const currentProjectName = currentTask.projectName;
      const selectedProject = this.projectGroups.find(
        (project) => project.title === currentProjectName
      );
      const currentAssignerId = currentTask.assignerId;
      const selectedAssignerName = this.Users.find(
        (user) => user.userId === currentAssignerId
      );
      const currentAssigneeId = currentTask.assigneeId;
      const selectedAssigneeName = this.Users.find(
        (user) => user.userId === currentAssigneeId
      );
      this.updateTaskNameControl.setValue(currentTask.title);
      this.updateTaskDescriptionControl.setValue(
        currentTask.description ?? null
      );
      this.updateDeadlineControl.setValue(currentTask.deadline);
      this.updateCategoryControl.setValue(currentTask.type);
      this.assignerUpdateControl.setValue(
        selectedAssignerName ? selectedAssignerName.fullName : null
      );
      this.assigneeUpdateControl.setValue(
        selectedAssigneeName ? selectedAssigneeName.fullName : null
      );
      this.updateProjectControl.setValue(
        selectedProject ? selectedProject.title : null
      );
    }
  }

  closeUpdateModal() {
    this.showUpdateModal = false;
  }
  onUpdateFileControlled(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.controlUpdateFiles = Array.from(input.files);
    }
  }
  onUpdateFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentType = this.getAttachmentType(file.name);
        this.selectedUpdateFiles.push({
          name: file.name,
          type: attachmentType !== undefined ? attachmentType : -1,
        });
      }
      this.fileNameUpdateControl.setValue(
        this.selectedUpdateFiles.map((file) => file.name).join(', ')
      );
    }
  }

  fileControl = new FormControl('', [Validators.required]);
  fileNameControl = new FormControl('', [Validators.required]);
  selectedFiles: { name: string; type: number }[] = [];
  taskNameControl = new FormControl('', [Validators.required]);
  taskDescriptionControl = new FormControl('', [Validators.required]);
  assignerControl = new FormControl('', [Validators.required]);
  deadlineControl = new FormControl('', [Validators.required]);
  projectControl = new FormControl('');
  assigneeControl = new FormControl('', [Validators.required]);
  categoryControl = new FormControl('', [Validators.required]);
  tagControl = new FormControl('', [Validators.required]);
  showModal: boolean = false;
  baseUrl = environment.baseUrl;
  isInfoBoxVisible: boolean = false;
  isInfoBox2Visible: boolean = false;
  isInfoBox3Visible: boolean = false;
  isInfoBox4Visible: boolean = false;
  isInfoBox5Visible: boolean = false;
  isInfoBox6Visible: boolean = false;
  AttachmentType = AttachmentType;
  CommentState = CommentState;
  TaskState = TaskState;
  tasks: Task[] = [];
  tasksAssignedToCurrentUser: Task[] = [];
  selectedTask: Task | null = null;
  projectGroups: Project[] = [];
  showProjectModal = false;
  projectForm = new FormGroup({
    title: new FormControl('', Validators.required),
    description: new FormControl(''),
  });

  openProjectModal(): void {
    this.showProjectModal = true;
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
  }

  submitProjectForm(): void {
    if (this.projectForm.valid) {
      const newProject = {
        title: this.projectForm.value.title ?? '',
        description: this.projectForm.value.description ?? '',
        createAt: new Date().toISOString(),
        tasks: [],
      };
      this.http.post(`${this.baseUrl}/api/projects`, newProject).subscribe({
        next: (project) => {
          this.closeProjectModal();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error creating project:', error);
        },
      });
    }
  }
  Users: User[] = [];
  Comments: Comment[] = [];
  newCommentText: string = '';
  isSlideOut = true;
  activeRoute: string = '';
  currentUser: any;
  isLoggedIn: boolean = false;
  loading: boolean = true;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.fetchTasks();
    this.fetchProjectGroups();
    this.fetchUsers();
    this.fetchComments();
  }
  filterTasksAssignedToCurrentUser(): void {
    if (this.currentUser) {
      this.tasksAssignedToCurrentUser = this.tasks.filter(
        (task) => task.assigneeId === this.currentUser!.userId
      );
    }
  }
  loadCurrentUser(): void {
    if (typeof localStorage !== 'undefined') {
      const userString = localStorage.getItem('user');
      if (userString) {
        const user = JSON.parse(userString);
        const userId = user.id;
        this.taskService.getUserById(userId).subscribe(
          (data) => {
            this.currentUser = data;
            this.isLoggedIn = true;
            this.filterTasksAssignedToCurrentUser();
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          },
          (error) => {
            console.error('Error fetching user info', error);
            this.loading = false;
            this.cdr.detectChanges();
          }
        );
      }
    }
  }
  getTodayDate(): string {
    const today = new Date();
    return this.datePipe.transform(today, 'dd MMMM YYYY') || '';
  }
  addOneDay(dateString: string): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return this.datePipe.transform(date, 'dd-MM-yyyy') || '';
  }
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.tags.update((tags) => [...tags, value]);
    }
    this.currentTag.set('');
  }
  remove(tag: string): void {
    this.tags.update((tags) => {
      const index = tags.indexOf(tag);
      if (index < 0) {
        return tags;
      }
      tags.splice(index, 1);
      this.announcer.announce(`Removed ${tag}`);
      return [...tags];
    });
  }
  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.update((tags) => [...tags, event.option.viewValue]);
    this.currentTag.set('');
    event.option.deselect();
  }
  controlFiles: File[] = [];

  onFileControlled(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.controlFiles = Array.from(input.files);
    }
  }
  onFileSelected(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const attachmentType = this.getAttachmentType(file.name);
        this.selectedFiles.push({
          name: file.name,
          type: attachmentType !== undefined ? attachmentType : -1,
        });
      }
      this.fileNameControl.setValue(
        this.selectedFiles.map((file) => file.name).join(', ')
      );
    }
  }
  getAttachmentType(fileName: string): AttachmentType | undefined {
    const extension = fileName.split('.').pop()?.toUpperCase();
    if (extension) {
      return AttachmentType[extension as keyof typeof AttachmentType];
    }
    return undefined;
  }
  uploadAttachment(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string }>(`${this.baseUrl}/api/attachments`, formData)
      .toPromise()
      .then((response) => {
        if (response && response.url) {
          return response.url;
        } else {
          console.error('No Url field in the response:', response);
          return '';
        }
      })
      .catch((error) => {
        console.error('Error uploading file:', file.name, error);
        throw error;
      });
  }
  async submitUpdateForm() {
    const selectedProjectName = this.updateProjectControl.value;
    const selectedProject = this.projectGroups.find(
      (project) => project.title === selectedProjectName
    );
    const projectId = selectedProject ? selectedProject.projectId : null;

    const selectedAssignerName = this.assignerUpdateControl.value;
    const selectedAssigner = this.Users.find(
      (user) => user.fullName === selectedAssignerName
    );
    const assignerId = selectedAssigner ? selectedAssigner.userId : null;

    const selectedAssigneeName = this.assigneeUpdateControl.value;
    const selectedAssignee = this.Users.find(
      (user) => user.fullName === selectedAssigneeName
    );
    const assigneeId = selectedAssignee ? selectedAssignee.userId : null;

    try {
      const attachmentUrls = await Promise.all(
        this.controlUpdateFiles.map((file) => this.uploadAttachment(file))
      );
      const formData = {
        title: this.updateTaskNameControl.value,
        description: this.updateTaskDescriptionControl.value ?? '',
        assignerId: assignerId ?? 1,
        assigneeId: assigneeId ?? 1,
        deadline: this.updateDeadlineControl.value
          ? new Date(this.updateDeadlineControl.value).toISOString()
          : null,
        type: this.updateCategoryControl.value,
        projectid: projectId,
        attachments: attachmentUrls.map((url, index) => ({
          Name: this.selectedUpdateFiles[index].name,
          FileType: this.selectedUpdateFiles[index].type,
          Url: url,
        })),
      };
      this.http
        .put(
          `${this.baseUrl}/api/tasks/modify/${this.currentUpdateId}`,
          formData
        )
        .subscribe({
          next: (response) => {
            this.closeUpdateModal();
            this.fetchTasks();
          },
          error: (error) => {
            if (error.error instanceof ErrorEvent) {
              console.error('Client-side error:', error.error.message);
            } else {
              console.error('Server-side error:', error);
              try {
                const errorResponse = JSON.parse(error.error);
                console.error('Error response:', errorResponse);
              } catch (e) {
                console.error('Non-JSON error response:', error.error);
              }
            }
            console.log('this', formData);
          },
        });
    } catch (error) {
      console.error('Error uploading attachments:', error);
    }
  }
  async submitForm() {
    const getRandomColor = () => {
      const letters = '0123456789ABCDEF';
      let color = '#';
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
      }
      return color;
    };
    const selectedProjectName = this.projectControl.value;
    const selectedProject = this.projectGroups.find(
      (project) => project.title === selectedProjectName
    );
    const projectId = selectedProject ? selectedProject.projectId : null;

    const selectedAssignerName = this.assignerControl.value;
    const selectedAssigner = this.Users.find(
      (user) => user.fullName === selectedAssignerName
    );
    const assignerId = selectedAssigner ? selectedAssigner.userId : null;

    const selectedAssigneeName = this.assigneeControl.value;
    const selectedAssignee = this.Users.find(
      (user) => user.fullName === selectedAssigneeName
    );
    const assigneeId = selectedAssignee ? selectedAssignee.userId : null;

    try {
      const attachmentUrls = await Promise.all(
        this.controlFiles.map((file) => this.uploadAttachment(file))
      );
      const formData = {
        title: this.taskNameControl.value,
        description: this.taskDescriptionControl.value ?? '',
        createdAt: new Date().toISOString(),
        assignerId: assignerId ?? 1,
        assigneeId: assigneeId ?? 1,
        deadline: this.deadlineControl.value
          ? new Date(this.deadlineControl.value).toISOString()
          : null,
        state: 0,
        type: this.categoryControl.value,
        projectid: projectId,
        taskTags: this.tags().map((tag) => ({
          Name: tag,
          Color: getRandomColor(),
        })),
        attachments: attachmentUrls.map((url, index) => ({
          Name: this.selectedFiles[index].name,
          FileType: this.selectedFiles[index].type,
          Url: url,
        })),
      };
      this.http.post(`${this.baseUrl}/api/tasks`, formData).subscribe({
        next: (response) => {
          this.closeModal();
          this.fetchTasks();
        },
        error: (error) => {
          console.error('Error:', error);
        },
      });
    } catch (error) {
      console.error('Error uploading attachments:', error);
    }
  }
  downloadAttachment(attachment: any) {
    this.http
      .get(`${this.baseUrl}/api/attachments/${attachment.attachmentId}`, {
        observe: 'response',
        responseType: 'blob',
      })
      .subscribe({
        next: (response) => {
          const blob = response.body;
          if (blob) {
            const fileName = attachment.name;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
          } else {
            console.error('Error: Blob is null');
          }
        },
        error: (error) => {
          console.error('Error downloading attachment:', error);
        },
      });
  }
  openModal() {
    this.showModal = true;
  }
  closeModal() {
    this.showModal = false;
    this.cdr.detectChanges();
  }
  sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      if (a.state === 2 && b.state !== 2) return -1;
      if (b.state === 2 && a.state !== 2) return 1;
      if (a.state === 1 && b.state !== 1) return 1;
      if (b.state === 1 && a.state !== 1) return -1;
      if (a.state === b.state) {
        return a.order - b.order;
      }
      return 0;
    });
  }
  drop(event: CdkDragDrop<string[]>) {
    const sortedTasks = this.sortTasks(this.tasks);
    moveItemInArray(sortedTasks, event.previousIndex, event.currentIndex);
    this.tasks = sortedTasks;
    this.saveTaskOrder();
  }
  getAssigneeNameById(id: number): string {
    const user = this.Users.find((user) => user.userId === id);
    console.log('The user', user?.fullName);
    return user ? user.fullName : 'Unknown';
  }
  getAssignerNameById(id: number): string {
    const user = this.Users.find((user) => user.userId === id);
    console.log('The user', user?.fullName);
    return user ? user.fullName : 'Unknown';
  }
  saveTaskOrder() {
    const taskOrder = this.tasks.map((task, index) => ({
      id: task.id,
      order: index,
    }));
    this.http
      .post(
        `${this.baseUrl}/api/tasks/save-task-order`,
        { tasks: taskOrder },
        { responseType: 'text' }
      )
      .subscribe((response) => {
        try {
          this.fetchTasks();
        } catch (e) {
          console.error('Error parsing response as JSON', response);
        }
      });
  }
  toggleCommentState(comment: any) {
    comment.state =
      comment.state === this.CommentState.checkedd
        ? this.CommentState.uncheckedd
        : this.CommentState.checkedd;

    this.updateCommentStateInDatabase(comment);
  }
  toggleTaskState(task: any, variable: any) {
    if (variable === 0) {
      task.state =
        task.state !== this.TaskState.prioritized
          ? this.TaskState.prioritized
          : this.TaskState.inprogress;
    } else {
      task.state =
        task.state !== this.TaskState.completed
          ? this.TaskState.completed
          : this.TaskState.inprogress;
    }
    this.updateTaskState(task);
  }
  updateCommentStateInDatabase(comment: any) {
    const updateCommentDto = {
      commentId: comment.commentId,
      state: comment.state,
    };
    this.http
      .put(
        `${this.baseUrl}/api/comments/${comment.commentId}`,
        updateCommentDto
      )
      .subscribe(
        () => {
          this.fetchComments();
        },
        (error) => {
          console.error('Error updating comment state', error);
        }
      );
  }
  updateTaskState(task: any) {
    const updateTaskDto = {
      id: task.id,
      state: task.state,
    };
    this.http
      .put(`${this.baseUrl}/api/tasks/${task.id}`, updateTaskDto)
      .subscribe(
        () => {
          this.fetchTasks();
        },
        (error) => {
          console.error('Error updating comment state', error);
        }
      );
  }
  selectTask(task: Task): void {
    this.selectedTask =
      this.selectedTask && this.selectedTask.id == task.id ? null : task;
  }

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
          this.applyFilters();
          this.filterTasksAssignedToCurrentUser();
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
  fetchProjectGroups(): void {
    this.taskService.getProjects().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.projectGroups = response.$values.map((project: any) => ({
            projectId: project.projectId,
            title: project.title,
          }));
          this.cdr.detectChanges();
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching project groups', error);
      }
    );
  }
  fetchUsers(): void {
    this.taskService.getUsers().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.Users = response.$values.map((user: any) => ({
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
  fetchComments(): void {
    this.taskService.getComments().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.Comments = response.$values.map((comment: any) => ({
            ...comment,
          }));
          this.cdr.detectChanges();
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching Comments', error);
      }
    );
  }
  deleteTask(id: number): void {
    if (id) {
      this.http.delete(`${this.baseUrl}/api/tasks/${id}`).subscribe(
        () => {
          if (this.selectedTask && this.selectedTask.id === id) {
            this.selectedTask = null;
          }
          this.fetchTasks();
        },
        (error) => {
          console.error('Error deleting task:', error);
        }
      );
    }
  }
  addComment() {
    if (this.selectedTask && this.newCommentText.trim()) {
      const newComment: Partial<Comment> = {
        commentText: this.newCommentText,
        state: 1,
        timeline: new Date().toISOString(),
        taskId: this.selectedTask.id,
        userId: this.currentUser.userId,
      };
      this.http
        .post<Comment>(`${this.baseUrl}/api/comments`, newComment)
        .subscribe(
          (response) => {
            this.selectedTask?.comments.push(response);
            this.newCommentText = '';
            this.fetchComments();
          },
          (error) => {
            console.error('Error adding comment:', error);
          }
        );
    }
  }
}
