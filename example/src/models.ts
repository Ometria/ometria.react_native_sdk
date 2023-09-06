export type ModalReinitializationProps = {
  setOmetriaToken: (token: string) => void;
  ometriaToken: string;
  saveNewOmetriaToken: (
    token: string,
    onSucces: (token: string) => Promise<void>
  ) => void;
  handleOmetriaInit: (token: string) => Promise<void>;
};
