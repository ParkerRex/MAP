'use client';

import * as RadixToast from '@radix-ui/react-toast';

type ToastProps = {
  message: string;
};

const Toast = ({ message }: ToastProps) => {
  return <div>{message}</div>;
};

export default Toast;
