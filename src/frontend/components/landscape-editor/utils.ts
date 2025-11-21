import { NodeId } from './types';

export function generateNodeId(type: string, ...parts: (string | number)[]): NodeId {
  return `${type}_${parts.join('_')}`;
}
