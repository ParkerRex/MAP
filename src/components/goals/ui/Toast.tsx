'use client';

import type * as _RadixToast from '@radix-ui/react-toast';

type ToastProps = {
  message: string;
};

const Toast = ({ message }: ToastProps) => {
  return <div>{message}</div>;
};

export default Toast;
