export function mergeConfig(cfg: any, abis: any) {
  let result: { [k: string]: any } = {};

  let events: any = [];
  for (const event of cfg.events) {
    for (const eventName of event.eventNames) {
      events.push(
        Object.assign(event, {
          eventName: eventName,
          abi: abis[event.abiRef],
        })
      );
    }
  }
  result["events"] = events;
  result["networks"] = cfg.networks;
  return result;
}
