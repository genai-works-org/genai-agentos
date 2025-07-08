import { toast } from 'react-toastify';
import CustomToast from '@/components/shared/CustomToast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(CustomToast({ title: 'Success', desc: message }), {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const showError = (message: string) => {
    toast.error(CustomToast({ title: 'Error', desc: message }), {
      position: 'top-center',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  return { showSuccess, showError };
};
