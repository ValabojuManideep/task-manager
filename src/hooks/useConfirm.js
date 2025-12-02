// src/hooks/useConfirm.js
import Swal from 'sweetalert2';

export const useConfirm = () => {
  const confirmAction = async (title = 'Are you sure?', text = '', icon = 'warning') => {
    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText: 'Yes, proceed!',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
    });

    return result.isConfirmed;
  };

  return { confirmAction };
};