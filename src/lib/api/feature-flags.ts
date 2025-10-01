const cache = new Map<string, boolean>();

export enum FeatureFlag {
	TASKROUTER_ENABLED = "TWILIO_TASKROUTER_ENABLED",
	QUICKBASE_SYNC = "QUICKBASE_SYNC_ENABLED",
	REAL_TIME_UPDATES = "REAL_TIME_UPDATES_ENABLED",
	ADVANCED_ROUTING = "ADVANCED_ROUTING_ENABLED",
}

export function isFeatureEnabled(flag: FeatureFlag): boolean {
	if (cache.has(flag)) return cache.get(flag)!;
	const raw = process.env[flag];
	const enabled = typeof raw === "string" && raw.toLowerCase() === "true";
	cache.set(flag, enabled);
	return enabled;
}

export function requireFeature(flag: FeatureFlag): void {
	if (!isFeatureEnabled(flag)) {
		throw new Error(`Feature ${flag} is not enabled`);
	}
}

export function getEnabledFeatures(): Record<FeatureFlag, boolean> {
	return {
		[FeatureFlag.TASKROUTER_ENABLED]: isFeatureEnabled(FeatureFlag.TASKROUTER_ENABLED),
		[FeatureFlag.QUICKBASE_SYNC]: isFeatureEnabled(FeatureFlag.QUICKBASE_SYNC),
		[FeatureFlag.REAL_TIME_UPDATES]: isFeatureEnabled(FeatureFlag.REAL_TIME_UPDATES),
		[FeatureFlag.ADVANCED_ROUTING]: isFeatureEnabled(FeatureFlag.ADVANCED_ROUTING),
	};
}

