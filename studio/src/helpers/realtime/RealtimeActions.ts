import { RealtimeActionParams } from '@/types';

export interface RealtimeActions<T> {
	delete?(param: RealtimeActionParams<T>): void;
	update?(param: RealtimeActionParams<T>): void;
	create?(param: RealtimeActionParams<T>): void;
	telemetry?(param: RealtimeActionParams<T>): void;
	log?(param: RealtimeActionParams<T>): void;
	deploy?(param: RealtimeActionParams<T>): void;
	redeploy?(param: RealtimeActionParams<T>): void;
	accept?(param: RealtimeActionParams<T>): void;
}
