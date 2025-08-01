import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task.service';
import { Attachment, AttachmentType } from '../../models/task.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-downloaded',
  standalone: true,
  templateUrl: './downloaded.component.html',
  imports: [CommonModule],
})
export class DownloadedComponent {
  AttachmentType = AttachmentType;
  private baseUrl = environment.baseUrl;
  attachments: Attachment[] = [];
  constructor(private taskService: TaskService, private http: HttpClient) {}
  downloadAttachment(attachment: any) {
    this.http
      .get(`${this.baseUrl}/api/attachments/${attachment.attachmentId}`, {
        observe: 'response',
        responseType: 'blob',
      })
      .subscribe({
        next: (response: any) => {
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
        error: (error: any) => {
          console.error('Error downloading attachment:', error);
        },
      });
  }
  fetchAttachments(): void {
    this.taskService.getAttachments().subscribe(
      (response: any) => {
        if (response && response.$values && Array.isArray(response.$values)) {
          this.attachments = response.$values.map((attach: any) => ({
            name: attach.name,
            uploadedAt: attach.uploadedAt,
            fileType: attach.fileType,
            attachmentId: attach.attachmentId,
          }));
        } else {
          console.error('Unexpected response format', response);
        }
      },
      (error) => {
        console.error('Error fetching users', error);
      }
    );
  }

  ngOnInit(): void {
    this.fetchAttachments();
    console.log(this.attachments);
  }
}
