// src/utils/sweetAlertConfig.js
import Swal from 'sweetalert2';

Swal.mixin({
  customClass: {
    confirmButton: 'btn btn-primary',
    cancelButton: 'btn btn-secondary',
  },
  buttonsStyling: false,
});

export default Swal;