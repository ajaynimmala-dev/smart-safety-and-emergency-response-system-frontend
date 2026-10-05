import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';

import { HttpClient } from '@angular/common/http';

import * as L from 'leaflet';

import { WebSocketService } from '../../service/websocket.service';
import { AlertService } from '../../service/alert-service';
import { AuthService } from '../../service/auth-service';

import { AlertResponse } from '../../interface/alert-response';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html'
})
export class DashboardComponent
  implements OnInit, OnDestroy {

  private map!: L.Map;

  private currentLocationMarker?: L.Marker;

  private locationInterval: any;

  private alertPollingInterval: any;

  private activeAlertId?: number;

  private activeAlerts: AlertResponse[] = [];

  private markers: Map<number, L.Marker> =
    new Map();

  private currentLatitude!: number;

  private currentLongitude!: number;

  private routeLine?: L.Polyline;


  constructor(
    private websocketService: WebSocketService,
    private alertService: AlertService,
    private authService: AuthService,
    private http: HttpClient
  ) {}


  ngOnInit(): void {

    this.createMap();

    (window as any).resolveAlert =
      (alertId: number) => {

        this.resolveAlert(alertId);

      };

    this.getCurrentLocation();

    this.startAlertPolling();

    this.websocketService.alert$.subscribe(
      (alert: AlertResponse) => {

        console.log(
          'Dashboard received alert:',
          alert
        );

        this.addMarker(alert);

        this.drawRouteToAlert(alert);

      }
    );

    this.websocketService.connect();

  }


  createMap(): void {

    this.map = L.map('map').setView(
      [17.3850, 78.4867],
      13
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(this.map);

    setTimeout(() => {

      this.map.invalidateSize();

    }, 200);

  }


  getCurrentLocation(): void {

    navigator.geolocation.getCurrentPosition(

      (position) => {

        console.log('FULL POSITION:', position);

        console.log(
          'LATITUDE:',
          position.coords.latitude
        );

        console.log(
          'LONGITUDE:',
          position.coords.longitude
        );

        console.log(
          'ACCURACY:',
          position.coords.accuracy,
          'meters'
        );

        console.log(
          'TIMESTAMP:',
          new Date(position.timestamp)
        );

        this.currentLatitude =
          position.coords.latitude;

        this.currentLongitude =
          position.coords.longitude;

        const currentLocationIcon = L.divIcon({

          className: 'current-location-marker',

          html: `
          <div style="
            width: 20px;
            height: 20px;
            background: blue;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 8px rgba(0,0,0,0.5);
          "></div>
        `,

          iconSize: [26, 26],
          iconAnchor: [13, 13]

        });

        if (this.currentLocationMarker) {
          this.map.removeLayer(this.currentLocationMarker);
        }

        this.currentLocationMarker =
          L.marker(
            [
              this.currentLatitude,
              this.currentLongitude
            ],
            {
              icon: currentLocationIcon
            }
          )
            .addTo(this.map)
            .bindPopup(`
          <b>My Current Location</b><br>
          Latitude: ${this.currentLatitude}<br>
          Longitude: ${this.currentLongitude}<br>
          Accuracy: ${position.coords.accuracy} meters
        `);

        this.map.setView(
          [
            this.currentLatitude,
            this.currentLongitude
          ],
          15
        );

        this.loadActiveAlerts();

      },

      (error) => {

        console.log(
          'LOCATION ERROR:',
          error
        );

      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }

    );

  }


  loadActiveAlerts(): void {

    this.alertService
      .getActiveAlerts()
      .subscribe({

        next: (alerts: AlertResponse[]) => {

          console.log(
            'ACTIVE ALERTS:',
            alerts
          );

          this.activeAlerts =
            alerts;

          alerts.forEach(
            (alert: AlertResponse) => {

              this.addMarker(alert);

              this.drawRouteToAlert(alert);

            }
          );

        },

        error: (error: any) => {

          console.log(
            'Failed to load active alerts:',
            error
          );

        }

      });

  }


  sendAlert(): void {

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        console.log(
          'Alert location:',
          latitude,
          longitude
        );

        this.alertService
          .createAlert(
            latitude,
            longitude
          )
          .subscribe({

            next: (response: AlertResponse) => {

              console.log(
                'Alert created:',
                response
              );

              this.activeAlertId =
                response.alertId;

              this.activeAlerts.push(
                response
              );

              this.startLocationTracking();

            },

            error: (error: any) => {

              console.log(
                'Alert failed:',
                error
              );

            }

          });

      },

      (error) => {

        console.log(
          'Location error:',
          error
        );

      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }

    );

  }


  startLocationTracking(): void {

    if (this.locationInterval) {

      clearInterval(
        this.locationInterval
      );

    }

    this.locationInterval =
      setInterval(() => {

        if (!this.activeAlertId) {

          return;

        }

        navigator.geolocation.getCurrentPosition(

          (position) => {

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;

            console.log(
              'LIVE LOCATION:',
              latitude,
              longitude
            );

            this.currentLatitude =
              latitude;

            this.currentLongitude =
              longitude;

            if (this.currentLocationMarker) {

              this.currentLocationMarker
                .setLatLng([
                  latitude,
                  longitude
                ]);

            }

            this.alertService
              .updateAlertLocation(
                this.activeAlertId!,
                latitude,
                longitude
              )
              .subscribe({

                next: (response) => {

                  console.log(
                    'Location updated:',
                    response
                  );

                },

                error: (error) => {

                  console.log(
                    'Location update failed:',
                    error
                  );

                }

              });

          },

          (error) => {

            console.log(
              'Location error:',
              error
            );

          },

          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }

        );

      }, 5000);

  }


  startAlertPolling(): void {

    if (this.alertPollingInterval) {
      clearInterval(this.alertPollingInterval);
    }

    this.alertPollingInterval = setInterval(() => {

      this.alertService
        .getActiveAlerts()
        .subscribe({

          next: (alerts: AlertResponse[]) => {

            console.log(
              'LATEST ALERTS:',
              alerts
            );

            // No active alerts
            if (alerts.length === 0) {

              console.log(
                'No active alerts - stopping polling'
              );

              clearInterval(
                this.alertPollingInterval
              );

              this.alertPollingInterval =
                undefined;

              return;
            }

            this.activeAlerts = alerts;

            alerts.forEach(
              (alert: AlertResponse) => {

                this.updateAlertMarker(alert);

                this.drawRouteToAlert(alert);

              }
            );

          },

          error: (error) => {

            console.log(
              'Polling error:',
              error
            );

          }

        });

    }, 5000);

  }


  addMarker(
    alert: AlertResponse
  ): void {

    if (
      this.markers.has(
        alert.alertId
      )
    ) {

      return;

    }

    const emergencyIcon =
      L.divIcon({

        className:
          'emergency-marker',

        html:
          '🚨',

        iconSize:
          [35, 35],

        iconAnchor:
          [17, 17],

        popupAnchor:
          [0, -17]

      });


    const currentUserId =
      Number(
        localStorage.getItem(
          'userId'
        )
      );


    let resolveButton = '';


    if (
      currentUserId ===
      alert.userId
    ) {

      resolveButton = `

        <br>

        <button
          onclick="window.resolveAlert(${alert.alertId})">

          Resolve Alert

        </button>

      `;

    }


    const marker =
      L.marker(

        [
          alert.latitude,
          alert.longitude
        ],

        {
          icon:
          emergencyIcon
        }

      )

        .addTo(this.map)

        .bindPopup(`

          <b>
            EMERGENCY ALERT
          </b>

          <br><br>

          <b>
            User:
          </b>

          ${alert.userName}

          <br>

          <b>
            Latitude:
          </b>

          ${alert.latitude}

          <br>

          <b>
            Longitude:
          </b>

          ${alert.longitude}

          <br>

          <b>
            Status:
          </b>

          ${alert.status}

          <br>

          <b>
            Time:
          </b>

          ${new Date(
          alert.createdAt
        ).toLocaleString()}

          ${resolveButton}

        `);


    this.markers.set(
      alert.alertId,
      marker
    );


    marker.openPopup();


    this.map.setView(

      [
        alert.latitude,
        alert.longitude
      ],

      15

    );

  }


  updateAlertMarker(
    alert: AlertResponse
  ): void {

    const marker =
      this.markers.get(
        alert.alertId
      );


    if (marker) {

      marker.setLatLng([

        alert.latitude,

        alert.longitude

      ]);

    }

    else {

      this.addMarker(alert);

    }

  }


  drawRouteToAlert(
    alert: AlertResponse
  ): void {

    if (

      this.currentLatitude ===
      undefined ||

      this.currentLongitude ===
      undefined

    ) {

      console.log(
        'Current location not available'
      );

      return;

    }


    const startLongitude =
      this.currentLongitude;

    const startLatitude =
      this.currentLatitude;

    const endLongitude =
      alert.longitude;

    const endLatitude =
      alert.latitude;


    const url =

      `https://router.project-osrm.org/route/v1/driving/` +

      `${startLongitude},${startLatitude};` +

      `${endLongitude},${endLatitude}` +

      `?overview=full&geometries=geojson`;


    console.log(
      'Route URL:',
      url
    );


    this.http
      .get<any>(url)
      .subscribe({

        next: (response) => {

          console.log(
            'Route response:',
            response
          );


          if (

            !response.routes ||

            response.routes.length === 0

          ) {

            console.log(
              'No route found'
            );

            return;

          }


          const coordinates =
            response
              .routes[0]
              .geometry
              .coordinates;


          const latLngs =
            coordinates.map(

              (coordinate: number[]) => {

                return [

                  coordinate[1],

                  coordinate[0]

                ] as L.LatLngExpression;

              }

            );


          if (this.routeLine) {

            this.map.removeLayer(
              this.routeLine
            );

          }


          this.routeLine =
            L.polyline(

              latLngs,

              {
                weight: 5
              }

            ).addTo(
              this.map
            );


          const distance =
            response.routes[0]
              .distance;


          const duration =
            response.routes[0]
              .duration;


          console.log(
            'Distance:',
            distance / 1000,
            'KM'
          );


          console.log(
            'Duration:',
            duration / 60,
            'Minutes'
          );

        },


        error: (error) => {

          console.log(
            'Route error:',
            error
          );

        }

      });

  }


  resolveAlert(
    alertId: number
  ): void {

    console.log(
      'Resolving alert:',
      alertId
    );


    this.alertService
      .resolveAlert(
        alertId
      )
      .subscribe({

        next: (response) => {

          console.log(
            'Alert resolved:',
            response
          );


          if (this.locationInterval) {

            clearInterval(
              this.locationInterval
            );

            this.locationInterval =
              undefined;

          }


          this.activeAlertId =
            undefined;


          const marker =
            this.markers.get(
              alertId
            );


          if (marker) {

            this.map.removeLayer(
              marker
            );

          }


          this.markers.delete(
            alertId
          );


          this.activeAlerts =
            this.activeAlerts.filter(
              alert =>
                alert.alertId !==
                alertId
            );


          if (this.routeLine) {

            this.map.removeLayer(
              this.routeLine
            );

            this.routeLine =
              undefined;

          }

        },


        error: (error) => {

          console.log(
            'Failed to resolve alert:',
            error
          );

        }

      });

  }


  logout(): void {

    this.stopIntervals();

    this.websocketService
      .disconnect();

    this.authService
      .logout();

  }


  private stopIntervals(): void {

    if (this.locationInterval) {

      clearInterval(
        this.locationInterval
      );

      this.locationInterval =
        undefined;

    }


    if (this.alertPollingInterval) {

      clearInterval(
        this.alertPollingInterval
      );

      this.alertPollingInterval =
        undefined;

    }

  }


  ngOnDestroy(): void {

    this.stopIntervals();

    this.websocketService
      .disconnect();


    if (this.map) {

      this.map.remove();

    }

  }

}
