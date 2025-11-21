import { CommunicationStyle } from './generation';

export const constants = {
  COMMUNICATION_STYLE_NAMES: {
    true_random: CommunicationStyle.TRUE_RANDOM,
    cohesive: CommunicationStyle.COHESIVE,
    random_exit: CommunicationStyle.RANDOM_EXIT,
  } as Record<string, CommunicationStyle>,
  PORT_MAX: 65535, // Technical limit for TCP/UDP ports
};
