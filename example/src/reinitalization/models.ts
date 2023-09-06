export type ModalTestingProp = {
  setToken: (token: string) => void;
  token: string;
  saveToken: (
    token: string,
    onSucces: (token: string) => Promise<void>
  ) => void;
  onSuccess: (token: string) => Promise<void>;
};
