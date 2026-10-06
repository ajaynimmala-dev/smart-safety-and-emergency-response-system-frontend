import { Injectable } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

export interface LocationUpdate {
  alertId: number;
  userId: number;
  userName: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  private client!: Client;

  private alertSubject =
    new Subject<any>();

  alert$ =
    this.alertSubject.asObservable();


  private locationSubject =
    new Subject<LocationUpdate>();

  location$ =
    this.locationSubject.asObservable();


  connect(): void {

    if (
      this.client &&
      this.client.connected
    ) {
      return;
    }


    this.client = new Client({

      webSocketFactory: () =>
        new SockJS(
          'https://smart-safety-and-emergency-response.onrender.com//ws'
        ),

      reconnectDelay: 5000,

      debug: (message: string) => {
        console.log(
          'STOMP:',
          message
        );
      }

    });


    this.client.onConnect = () => {

      console.log(
        'WebSocket CONNECTED'
      );


      this.client.subscribe(
        '/topic/alerts',
        (message: IMessage) => {

          const alert =
            JSON.parse(
              message.body
            );

          console.log(
            ' ALERT RECEIVED:',
            alert
          );

          this.alertSubject.next(
            alert
          );
        }
      );


      console.log(
        ' Subscribed to /topic/alerts'
      );


      this.client.subscribe(
        '/topic/locations',
        (message: IMessage) => {

          const location:
            LocationUpdate =
            JSON.parse(
              message.body
            );

          console.log(
            '📍 LIVE LOCATION RECEIVED:',
            location
          );

          this.locationSubject.next(
            location
          );
        }
      );


      console.log(
        ' Subscribed to /topic/locations'
      );

    };


    this.client.onStompError =
      (frame) => {

        console.error(
          ' STOMP ERROR:',
          frame
        );

      };


    this.client.activate();

  }


  sendLocation(
    location: LocationUpdate
  ): void {

    if (
      !this.client ||
      !this.client.connected
    ) {

      console.log(
        ' WebSocket not connected'
      );

      return;
    }


    this.client.publish({

      destination:
        '/app/location',

      body:
        JSON.stringify(
          location
        )

    });


    console.log(
      '📍 LOCATION SENT:',
      location
    );

  }


  disconnect(): void {

    if (this.client) {

      this.client.deactivate();

    }

  }

}
