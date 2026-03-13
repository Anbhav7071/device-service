import { Action } from './action.enum';
import { Resource } from '../resource.enum';

export interface Permission {
    resource: Resource | string;
    action: Action | string;
}
