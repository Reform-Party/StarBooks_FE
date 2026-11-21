// 아직 총 개수를 모를 때는 쪽 이동을 노출하지 않아요.
export const EMPTY_PAGINATION = {
  page: 0,
  totalPages: 0,
  totalElements: 0,
  hasPrevious: false,
  hasNext: false,
  onPageChange: () => {},
};
