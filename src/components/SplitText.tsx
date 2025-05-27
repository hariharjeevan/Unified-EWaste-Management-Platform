//From ReactBits
//Credits: https://www.reactbits.dev/text-animations/split-text

import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

type SplitTextProps = {
  text?: string;
  className?: string;
  delay?: number;
  animationFrom?: object;
  animationTo?: object;
  easing?: string;
  threshold?: number;
  rootMargin?: string;
  textAlign?: React.CSSProperties['textAlign'];
};

const SplitText = ({
  text = '',
  className = '',
  delay = 100,
  animationFrom = { opacity: 0, transform: 'translate3d(0,40px,0)' },
  animationTo = { opacity: 1, transform: 'translate3d(0,0,0)' },
  easing = 'easeOutCubic',
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
}: SplitTextProps) => {
  const words = text.split(' ').map(word => word.split(''));
  const letters = words.flat();
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  const animatedCount = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      { threshold, rootMargin }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  // Provide a default cubic easing function if easing is a string
  const getEasing = () => {
    if (typeof easing === 'function') return easing;
    // Example: easeOutCubic
    if (easing === 'easeOutCubic') {
      return (t: number) => 1 - Math.pow(1 - t, 3);
    }
    // Fallback to linear
    return (t: number) => t;
  };

  const springs = useSprings(
    letters.length,
    letters.map((_, i) => ({
      from: animationFrom,
      to: inView
        ? async (next: (props: object) => Promise<void>) => {
            await next(animationTo);
            animatedCount.current += 1;
          }
        : animationFrom,
      delay: i * delay,
      config: { easing: getEasing() },
    }))
  );

  return (
    <p
      ref={ref}
      className={`split-parent overflow-hidden inline ${className}`}
      style={{ textAlign, whiteSpace: 'normal', wordWrap: 'break-word' }}
    >
      {words.map((word, wordIndex) => (
        <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.map((letter, letterIndex) => {
            const index = words
              .slice(0, wordIndex)
              .reduce((acc, w) => acc + w.length, 0) + letterIndex;

            return (
              <animated.span
                key={index}
                style={springs[index] as any}
                className="inline-block transform transition-opacity will-change-transform"
              >
                {letter}
              </animated.span>
            );
          })}
          <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
        </span>
      ))}
    </p>
  );
};

export default SplitText;
