import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  Task,
  Project,
  User,
  Comment,
  Event,
  Message,
  Attachment,
} from '../models/task.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  // private baseUrl = 'http://localhost:5187';
  private baseUrl = environment.baseUrl;
  private taskUrl = this.baseUrl + '/api/tasks';
  private projectUrl = this.baseUrl + '/api/projects';
  private userUrl = this.baseUrl + '/api/users';
  private commentUrl = this.baseUrl + '/api/comments';
  private eventUrl = this.baseUrl + '/api/events';
  private messageUrl = this.baseUrl + '/api/messages';
  private attachmentUrl = this.baseUrl + '/api/attachments';
  constructor(private http: HttpClient) {}

  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.taskUrl);
  }

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.projectUrl);
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.userUrl);
  }

  getComments(): Observable<Comment[]> {
    return this.http.get<Comment[]>(this.commentUrl);
  }

  getEvents(): Observable<Event[]> {
    return this.http.get<Event[]>(this.eventUrl);
  }

  getAttachments(): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(this.attachmentUrl);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.userUrl}/${id}`);
  }

  getMessagesBetweenUsers(
    userId1: number,
    userId2: number
  ): Observable<Message[]> {
    return this.http
      .get<Message[]>(`${this.messageUrl}/between/${userId1}/${userId2}`)
      .pipe(map((response: any) => resolveReferences(response)));
  }
  addMessage(message: {
    messageText: string;
    senderId: number;
    receiverId: number;
  }): Observable<Message> {
    return this.http.post<Message>(this.messageUrl, message);
  }
}
function resolveReferences(data: any): any {
  const idMap = new Map<string, any>();

  function resolve(obj: any): any {
    if (obj && typeof obj === 'object') {
      if (obj.$id) {
        idMap.set(obj.$id, obj);
      }
      if (obj.$ref) {
        return idMap.get(obj.$ref);
      }
      for (const key of Object.keys(obj)) {
        obj[key] = resolve(obj[key]);
      }
    }
    return obj;
  }

  return resolve(data);
}
