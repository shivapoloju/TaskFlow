export const apiStatusConstants = {
  initial: 'INITIAL',
  inProgress: 'IN_PROGRESS',
  success: 'SUCCESS',
  failure: 'FAILURE',
};

export type ApiStatus = typeof apiStatusConstants[keyof typeof apiStatusConstants];
