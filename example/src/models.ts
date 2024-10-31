export type ModalReinitializationProps = {
  setOmetriaToken: (token: string) => void;
  ometriaToken: string;
  saveNewOmetriaToken: (
    token: string,
    onSucces: (token: string) => Promise<void>
  ) => void;
  handleOmetriaInit: (token: string) => Promise<void>;
};

export type AuthModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onLogin: (method: { userEmail?: string; userId?: string }) => void;
  onUpdateStoreId: (storeId: string | null) => void;
  reinitialization: ModalReinitializationProps;
  ometriaIsInitialized: boolean;
};
