// import { useAnimationControls, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react"
import styled from "styled-components";

const PlayerToken = styled.div.attrs<{ position?: [number,number]; visibility?: number; }>(props=>({
  style: {
    transform: props.position ? `translate3d(${props.position[0] -40}px, ${props.position[1] -40}px, 0)` : "translate3d(0px, 0px)",
    opacity: props.visibility || "0"
  },
}))`
  width: 60px;
  height: 60px;
  background: rgb(255 125 125);
  border-radius: 50%;
  position: relative;
  transition: opacity 100ms ease-in-out;
`;

type PlayzoneProps = {
    onDrop: Function;
    gridSize: number[]
    disabled: boolean;
}
const Playzone = ({onDrop, gridSize, disabled}: PlayzoneProps) => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [columnArray, setColumnArray] = useState([0]);
    const [playerTokenVisibility, setPlayerTokenVisibility] = useState(0);
    const elementRef = useRef<HTMLDivElement>(null)
    const element = elementRef.current;
    const playZoneWidth = element?.getBoundingClientRect().width || 1;

    // const tokenAnimationControls = useAnimationControls();

    useEffect(()=> {
      const columns = [];
      for(let i=1; i <= gridSize[0]; i++) {
        columns.push(100/gridSize[0]*i)
      }
      setColumnArray(columns);
    }, [gridSize])

    useEffect(() => {
      const updateMousePosition = (ev: MouseEvent) => {
        const target = ev.target as HTMLDivElement;
        const positionInZone = [ev.clientX- target.offsetLeft, ev.clientY-target.offsetTop]

        setMousePosition({ x: positionInZone[0], y: positionInZone[1] });
        // tokenAnimationControls.start({translateX: ev.clientX, translateY: ev.clientY});
      };

      element && element.addEventListener('mousemove', updateMousePosition);
      element && element.addEventListener('mouseenter', () => setPlayerTokenVisibility(1));
      element && element.addEventListener('mouseleave', () => setPlayerTokenVisibility(0));
      return () => {
        element && element.removeEventListener('mousemove', updateMousePosition);
        element && element.removeEventListener('mouseenter', () => setPlayerTokenVisibility(1));
        element && element.removeEventListener('mouseleave', () => setPlayerTokenVisibility(0));
      };
    }, [elementRef, element]);

    function handleClick() {
      for (let i = 0; i< columnArray.length; i++) {
        if(mousePosition.x / playZoneWidth * 100 < columnArray[i]) {
          return onDrop(i);
        };
      }
    }

    return (
        <div ref={elementRef} className="grid-play-zone" onClick={() => disabled? console.log('Playzone disabled') : handleClick()}>
            {/* Soucis de perf avec framer */}
            {/* <motion.div className="grid-play-zone-token" animate={tokenAnimationControls}></motion.div> */}
            <PlayerToken position={[mousePosition.x,mousePosition.y]} visibility={playerTokenVisibility}></PlayerToken>
        </div>
    )
  }
export default Playzone