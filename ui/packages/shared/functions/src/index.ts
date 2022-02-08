export const capitalize = (a: string): string =>
  a
    .split(' ')
    .map(p => p[0].toUpperCase() + p.substr(1).toLocaleLowerCase())
    .join(' ');

export interface TimeObject {
  nanoseconds?: number;
  microseconds?: number;
  milliseconds?: number;
  seconds?: number;
  minutes?: number;
  hours?: number;
  days?: number;
  weeks?: number;
  years?: number;
}

export enum TimeUnits {
  Nanoseconds = 'nanoseconds',
  Microseconds = 'microseconds',
  Milliseconds = 'milliseconds',
  Seconds = 'seconds',
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
  Weeks = 'weeks',
  Years = 'years',
}

const unitsInTime = {
  [TimeUnits.Nanoseconds]: {multiplier: 1, symbol: 'ns'},
  [TimeUnits.Microseconds]: {multiplier: 1e3, symbol: 'µs'},
  [TimeUnits.Milliseconds]: {multiplier: 1e6, symbol: 'ms'},
  [TimeUnits.Seconds]: {multiplier: 1e9, symbol: 's'},
  [TimeUnits.Minutes]: {multiplier: 6 * 1e10, symbol: 'm'},
  [TimeUnits.Hours]: {multiplier: 60 * 60 * 1e9, symbol: 'h'},
  [TimeUnits.Days]: {multiplier: 60 * 60 * 24 * 1e9, symbol: 'd'},
  [TimeUnits.Weeks]: {multiplier: 60 * 60 * 24 * 7 * 1e9, symbol: 'w'},
  [TimeUnits.Years]: {multiplier: 60 * 60 * 24 * 365 * 1e9, symbol: 'y'},
};

export const convertTime = (value: number, from: TimeUnits, to: TimeUnits): number => {
  const startUnit = unitsInTime[from];
  const endUnit = unitsInTime[to];
  if (!startUnit || !endUnit) {
    console.error('invalid start or end unit provided');
    return value;
  }

  return (value * startUnit.multiplier) / endUnit.multiplier;
};

export const formatDuration = (timeObject: TimeObject, to: TimeUnits) => {
  let values: string[] = [];
  const unitsLargeToSmall = Object.values(TimeUnits).reverse();

  let nanoseconds = Object.keys(timeObject)
    .map(unit => {
      return timeObject[unit]
        ? convertTime(timeObject[unit], TimeUnits[unit], TimeUnits.Nanoseconds)
        : 0;
    })
    .reduce((prev, curr) => prev + curr, 0);

  // for more than one second, just show up until whole seconds; otherwise, show whole microseconds
  if (Math.floor(nanoseconds / unitsInTime[TimeUnits.Seconds].multiplier) > 0) {
    for (let i = 0; i < unitsLargeToSmall.length; i++) {
      const multiplier = unitsInTime[unitsLargeToSmall[i]].multiplier;

      if (nanoseconds > multiplier) {
        if (unitsLargeToSmall[i] === TimeUnits.Milliseconds) {
          break;
        } else {
          const amount = Math.floor(nanoseconds / multiplier);
          values = [...values, `${amount}${unitsInTime[unitsLargeToSmall[i]].symbol}`];
          nanoseconds -= amount * multiplier;
        }
      }
    }
  } else {
    const milliseconds = Math.floor(nanoseconds / unitsInTime[TimeUnits.Milliseconds].multiplier);
    if (milliseconds > 0) {
      values = [`${milliseconds}${unitsInTime[TimeUnits.Milliseconds].symbol}`];
    } else {
      return '<1ms';
    }
  }

  return values.join(' ');
};

const unitsInBytes = {
  bytes: {multiplier: 1, symbol: 'Bytes'},
  kilobytes: {multiplier: 1e3, symbol: 'kB'},
  megabytes: {multiplier: 1e6, symbol: 'MB'},
  gigabytes: {multiplier: 1e9, symbol: 'GB'},
  terabytes: {multiplier: 1e12, symbol: 'TB'},
  petabytes: {multiplier: 1e15, symbol: 'PB'},
  exabytes: {multiplier: 1e18, symbol: 'EB'},
};

const unitsInCount = {
  unit: {multiplier: 1, symbol: ''},
  kilo: {multiplier: 1e3, symbol: 'k'},
  mega: {multiplier: 1e6, symbol: 'M'},
  giga: {multiplier: 1e9, symbol: 'G'},
  tera: {multiplier: 1e12, symbol: 'T'},
  peta: {multiplier: 1e15, symbol: 'P'},
  exa: {multiplier: 1e18, symbol: 'E'},
};

const knownValueFormatters = {
  bytes: unitsInBytes,
  nanoseconds: unitsInTime,
  count: unitsInCount,
};

export const valueFormatter = (num: number, unit: string, digits: number): string => {
  const absoluteNum = Math.abs(num);
  const format: {multiplier: number; symbol: string}[] = Object.values(knownValueFormatters[unit]);

  if (format === undefined || format === null) {
    return num.toString();
  }

  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = format.length - 1; i > 0; i--) {
    if (absoluteNum >= format[i].multiplier) {
      break;
    }
  }
  return (num / format[i].multiplier).toFixed(digits).replace(rx, '$1') + format[i].symbol;
};
