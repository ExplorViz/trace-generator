import { CommunicationStyle } from './generation';

export const constants = {
  MAX_APP_COUNT: 500,
  MAX_CLASS_COUNT: 200,
  MAX_METHODS: 10,
  MAX_PACKAGE_DEPTH: 10,
  MAX_TRACE_DURATION: 10000,
  MAX_CALL_COUNT: 10000,
  MAX_CALL_DEPTH: 100,
  COMMUNICATION_STYLE_NAMES: {
    true_random: CommunicationStyle.TRUE_RANDOM,
    cohesive: CommunicationStyle.COHESIVE,
    random_exit: CommunicationStyle.RANDOM_EXIT,
  } as Record<string, CommunicationStyle>,
  PORT_MAX: 65535,
};
