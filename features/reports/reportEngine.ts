import { FilterRule, SortRule, GroupByType } from './types';

export function applyFilters<T>(data: T[], filters: FilterRule[]): T[] {
  if (!filters || filters.length === 0) return data;

  return data.filter(item => {
    return filters.every(filter => {
      const { field, operator, value, secondValue } = filter;
      const rawValue = (item as any)[field];

      if (rawValue === undefined || rawValue === null) {
        return value === '' || value === null || operator === '!=';
      }

      const strVal = String(rawValue).toLowerCase();
      const targetVal = value !== undefined && value !== null ? String(value).toLowerCase() : '';

      switch (operator) {
        case '=':
          return strVal === targetVal;
        case '!=':
          return strVal !== targetVal;
        case 'CONTAINS':
          return strVal.includes(targetVal);
        case 'STARTS WITH':
          return strVal.startsWith(targetVal);
        case 'IN': {
          const list = Array.isArray(value) 
            ? value.map((v: any) => String(v).toLowerCase())
            : targetVal.split(',').map((s: string) => s.trim());
          return list.includes(strVal) || list.some((itemVal: string) => strVal.includes(itemVal));
        }
        case 'NOT IN': {
          const list = Array.isArray(value) 
            ? value.map((v: any) => String(v).toLowerCase())
            : targetVal.split(',').map((s: string) => s.trim());
          return !list.includes(strVal) && !list.some((itemVal: string) => strVal.includes(itemVal));
        }
        case '>':
          return Number(rawValue) > Number(value);
        case '<':
          return Number(rawValue) < Number(value);
        case '>=':
          return Number(rawValue) >= Number(value);
        case '<=':
          return Number(rawValue) <= Number(value);
        case 'BETWEEN': {
          const num = Number(rawValue);
          const min = Number(value);
          const max = Number(secondValue);
          if (!isNaN(num) && !isNaN(min) && !isNaN(max)) {
            return num >= min && num <= max;
          }
          // Date string comparison fallback
          const dateStr = String(rawValue);
          const minDate = String(value);
          const maxDate = String(secondValue);
          return dateStr >= minDate && dateStr <= maxDate;
        }
        default:
          return true;
      }
    });
  });
}

export function applySorting<T>(data: T[], sorts: SortRule[]): T[] {
  if (!sorts || sorts.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sorts) {
      const { field, direction } = sort;
      const valA = (a as any)[field];
      const valB = (b as any)[field];

      if (valA === valB) continue;
      if (valA === undefined || valA === null) return direction === 'asc' ? 1 : -1;
      if (valB === undefined || valB === null) return direction === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      } else {
        comparison = String(valA).localeCompare(String(valB));
      }

      if (comparison !== 0) {
        return direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

export interface GroupedData<T> {
  groupKey: string;
  items: T[];
  aggregates: {
    count: number;
    sumAmount?: number;
    avgAmount?: number;
    sumGrossPay?: number;
    sumNetPay?: number;
    sumTaxes?: number;
  };
}

export function applyGrouping<T>(data: T[], groupByField: GroupByType): GroupedData<T>[] {
  if (!groupByField || groupByField === 'none') {
    return [{
      groupKey: 'All Records',
      items: data,
      aggregates: calculateAggregates(data)
    }];
  }

  const map = new Map<string, T[]>();

  data.forEach(item => {
    let key = (item as any)[groupByField];
    if (key === undefined || key === null || key === '') {
      key = 'Unassigned / Other';
    } else if (groupByField === 'date' || groupByField === 'payDate' || groupByField === 'payPeriod') {
      const str = String(key);
      if (str.length >= 7) {
        key = str.substring(0, 7); // YYYY-MM
      }
    }
    const group = map.get(String(key)) || [];
    group.push(item);
    map.set(String(key), group);
  });

  const result: GroupedData<T>[] = [];
  map.forEach((items, groupKey) => {
    result.push({
      groupKey,
      items,
      aggregates: calculateAggregates(items)
    });
  });

  return result.sort((a, b) => a.groupKey.localeCompare(b.groupKey));
}

function calculateAggregates(items: any[]) {
  const count = items.length;
  let sumAmount = 0;
  let sumGrossPay = 0;
  let sumNetPay = 0;
  let sumTaxes = 0;

  items.forEach(item => {
    if (item.amount !== undefined) sumAmount += Number(item.amount) || 0;
    if (item.grossPay !== undefined) sumGrossPay += Number(item.grossPay) || 0;
    if (item.netPay !== undefined) sumNetPay += Number(item.netPay) || 0;
    if (item.totalTaxes !== undefined) sumTaxes += Number(item.totalTaxes) || 0;
  });

  return {
    count,
    sumAmount: Number(sumAmount.toFixed(2)),
    avgAmount: count > 0 ? Number((sumAmount / count).toFixed(2)) : 0,
    sumGrossPay: Number(sumGrossPay.toFixed(2)),
    sumNetPay: Number(sumNetPay.toFixed(2)),
    sumTaxes: Number(sumTaxes.toFixed(2)),
  };
}
