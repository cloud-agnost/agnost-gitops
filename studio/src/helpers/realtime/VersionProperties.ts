import { RealtimeActionParams, Version as VersionType } from '@/types';
import { RealtimeActions } from './RealtimeActions';
import Version from './Version';
class VersionProperties implements RealtimeActions<VersionType> {
	version = new Version();
	delete(param: RealtimeActionParams<VersionType>): void {
		this.version.update(param);
	}
	update(param: RealtimeActionParams<VersionType>): void {
		this.version.update(param);
	}
	create(param: RealtimeActionParams<VersionType>): void {
		this.version.update(param);
	}
}

export default VersionProperties;
