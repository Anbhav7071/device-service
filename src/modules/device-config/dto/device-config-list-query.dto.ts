import { getListQueryDto } from '../../../common/dto/list-query.dto';
import {
    ALLOWED_FILTER_FIELDS,
    ALLOWED_SELECT_FIELDS,
    ALLOWED_ORDER_FIELDS,
    ALLOWED_RELATIONS,
} from '../filters/device-config.filter';

export class DeviceConfigListQueryDto extends getListQueryDto(
    ALLOWED_FILTER_FIELDS,
    ALLOWED_SELECT_FIELDS,
    ALLOWED_ORDER_FIELDS,
    ALLOWED_RELATIONS,
) { }
