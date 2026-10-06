import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { AlertResponse } from '../interface/alert-response';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private apiUrl = 'https://smart-safety-and-emergency-response.onrender.com/api/alerts';


  constructor(private http: HttpClient) {
  }

  createAlert(
    latitude: number,
    longitude: number
  ): Observable<AlertResponse> {

    return this.http.post<AlertResponse>(
      this.apiUrl,
      {
        latitude: latitude,
        longitude: longitude
      }
    );

  }

  getActiveAlerts(): Observable<AlertResponse[]> {

    return this.http.get<AlertResponse[]>(
      `${this.apiUrl}/active`
    );

  }

  resolveAlert(alertId: number): Observable<string> {
    return this.http.put(
      `${this.apiUrl}/${alertId}/resolve`,
      {},
      {
        responseType: 'text'
      }
    );
  }

  updateAlertLocation(
    alertId: number,
    latitude: number,
    longitude: number
  ) {

    return this.http.put<AlertResponse>(
      `https://smart-safety-and-emergency-response.onrender.com/api/alerts/${alertId}/location`,
      null,
      {
        params: {
          latitude: latitude.toString(),
          longitude: longitude.toString()
        }
      }
    );

  }
}
