export interface SuccessResDTO<ActualData> {
  data: ActualData;
}

export interface ErrorResDTO<E> {
  error: E;
}

export type DefaultResDTO<D, E> = SuccessResDTO<D> | ErrorResDTO<E>;
