import { getListQueryDto } from '../../../common/dto/list-query.dto';
import {
    ALLOWED_FILTER_FIELDS,
    ALLOWED_SELECT_FIELDS,
    ALLOWED_ORDER_FIELDS,
    ALLOWED_RELATIONS,
} from '../filters/device-assignment.filter';

export class DeviceAssignmentListQueryDto extends getListQueryDto(
    ALLOWED_FILTER_FIELDS,
    ALLOWED_SELECT_FIELDS,
    ALLOWED_ORDER_FIELDS,
    ALLOWED_RELATIONS,
) { }
