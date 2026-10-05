import { AlertStatus } from '../enum/alert-status.enum';
import { AlertType } from '../enum/alert-type.enum';

export interface AlertResponse {
  alertId: number;
  userId: number;
  userName: string;
  latitude: number;
  longitude: number;
  alertType: AlertType;
  status: AlertStatus;
  createdAt: string;
}
