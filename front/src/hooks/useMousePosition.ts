import { MutableRefObject, useEffect, useState } from "react";

const useMousePositionOnElement = (node: MutableRefObject<HTMLElement>) => {
  const [mousePosition,setMousePosition] = useState({ x: 0, y: 0 });
  const element = node.current;
  
  useEffect(() => {
    const updateMousePosition = (ev: MouseEvent) => {
      setMousePosition({ x: ev.clientX, y: ev.clientY });
    };
    element.addEventListener('mousemove', updateMousePosition);
    return () => {
      element.removeEventListener('mousemove', updateMousePosition);
    };
  }, [element]);

  return mousePosition;
};
export default useMousePositionOnElement;