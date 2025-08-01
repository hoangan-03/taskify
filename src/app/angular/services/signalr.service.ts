import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  private baseUrl = environment.baseUrl;
  private apiUrl = this.baseUrl + '/chathub';
  private hubConnection: signalR.HubConnection;
  private messageReceived = new Subject<{
    user: string;
    message: string;
    senderId: number;
    receiverId: number;
  }>();
  private connectionEstablished = new Subject<boolean>();

  constructor() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.apiUrl)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on(
      'ReceiveMessage',
      (user: string, message: string, senderId: number, receiverId: number) => {
        this.messageReceived.next({ user, message, senderId, receiverId });
      }
    );

    this.hubConnection.onreconnecting((error) => {
      console.warn(`Connection lost due to error "${error}". Reconnecting.`);
      this.connectionEstablished.next(false);
    });

    this.hubConnection.onreconnected((connectionId) => {
      console.log(
        `Connection reestablished. Connected with connectionId "${connectionId}".`
      );
      this.connectionEstablished.next(true);
    });

    this.hubConnection.onclose((error) => {
      console.error(`Connection closed due to error "${error}".`);
      this.connectionEstablished.next(false);
    });
  }

  startConnection(): Promise<void> {
    return this.hubConnection
      .start()
      .then(() => {
        this.connectionEstablished.next(true);
      })
      .catch((err) => {
        console.error('Error while starting connection: ' + err);
        this.connectionEstablished.next(false);
      });
  }

  sendMessage(
    user: string,
    message: string,
    senderId: number,
    receiverId: number
  ) {
    if (this.hubConnection.state === signalR.HubConnectionState.Connected) {
      this.hubConnection
        .invoke('SendMessage', user, message, senderId, receiverId)
        .catch((err) => console.error(err));
    } else {
      console.error('Cannot send message. Connection is not established.');
    }
  }

  getMessage(): Observable<{
    user: string;
    message: string;
    senderId: number;
    receiverId: number;
  }> {
    return this.messageReceived.asObservable();
  }

  isConnectionEstablished(): Observable<boolean> {
    return this.connectionEstablished.asObservable();
  }

  stopConnection() {
    this.hubConnection
      .stop()
      .then(() => {
        this.connectionEstablished.next(false);
      })
      .catch((err) => console.error('Error while stopping connection: ' + err));
  }
}
