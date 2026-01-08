import styles from './Tooltip.module.css';
import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { createPortal } from 'react-dom';

// Sistema global para gerenciar tooltips abertos
const activeTooltips = new Set();
const closeAllTooltips = (currentInstance) => {
  activeTooltips.forEach((instance) => {
    if (instance !== currentInstance && instance?.current?.hide) {
      instance.current.hide();
    }
  });
};

export const Tooltip = forwardRef((props, ref) => {
  const {
    placement = 'top',
    disabled = false,
    distance = 8,
    open: controlledOpen,
    skidding = 0,
    showDelay = 150,
    hideDelay = 0,
    trigger = 'hover focus',
    withoutArrow = false,
    content,
    children,
    onShow,
    onAfterShow,
    onHide,
    onAfterHide,
  } = props;

  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState(placement);
  // Initial state is far off-screen to avoid 0,0 flash
  const [position, setPosition] = useState({ top: -9999, left: -9999 });
  const [arrowPosition, setArrowPosition] = useState({ top: 'auto', left: 'auto' });
  
  useEffect(() => {
    if (!isOpen) {
      // Reset to off-screen when closed
      setPosition({ top: -9999, left: -9999 });
      setArrowPosition({ top: 'auto', left: 'auto' });
    }
  }, [isOpen]);

  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const animationTimerRef = useRef(null);
  const isControlled = controlledOpen !== undefined;
  const isAnimatingRef = useRef(false);
  const instanceRef = useRef({ hide: null });

  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    let tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      const originalVisibility = tooltipRef.current.style.visibility;
      const originalDisplay = tooltipRef.current.style.display;
      const originalPosition = tooltipRef.current.style.position;
      
      tooltipRef.current.style.visibility = 'hidden';
      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.position = 'absolute';
      tooltipRef.current.style.top = '0';
      tooltipRef.current.style.left = '0';
      
      tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      tooltipRef.current.style.visibility = originalVisibility;
      tooltipRef.current.style.display = originalDisplay;
      tooltipRef.current.style.position = originalPosition;
      
      if (tooltipRect.width === 0 || tooltipRect.height === 0) {
        return;
      }
    }
    
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;

    let top = 0;
    let left = 0;
    let finalPlacement = placement;
    let arrowTop = 'auto';
    let arrowLeft = 'auto';

    const placements = {
      top: () => {
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        left = targetRect.left + scrollX + targetRect.width / 2 - tooltipRect.width / 2 + skidding;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width / 2;
      },
      'top-start': () => {
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        left = targetRect.left + scrollX + skidding;
        arrowTop = tooltipRect.height;
        arrowLeft = 20;
      },
      'top-end': () => {
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        left = targetRect.left + scrollX + targetRect.width - tooltipRect.width + skidding;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width - 20;
      },
      bottom: () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + targetRect.width / 2 - tooltipRect.width / 2 + skidding;
        arrowTop = -6;
        arrowLeft = tooltipRect.width / 2;
      },
      'bottom-start': () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + skidding;
        arrowTop = -6;
        arrowLeft = 20;
      },
      'bottom-end': () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + targetRect.width - tooltipRect.width + skidding;
        arrowTop = -6;
        arrowLeft = tooltipRect.width - 20;
      },
      left: () => {
        top = targetRect.top + scrollY + targetRect.height / 2 - tooltipRect.height / 2 + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = 'auto';
        arrowLeft = 'auto';
      },
      'left-start': () => {
        top = targetRect.top + scrollY + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = 8;
        arrowLeft = 'auto';
      },
      'left-end': () => {
        top = targetRect.top + scrollY + targetRect.height - tooltipRect.height + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = tooltipRect.height - 20;
        arrowLeft = 'auto';
      },
      right: () => {
        top = targetRect.top + scrollY + targetRect.height / 2 - tooltipRect.height / 2 + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = 'auto';
        arrowLeft = 'auto';
      },
      'right-start': () => {
        top = targetRect.top + scrollY + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = 8;
        arrowLeft = 'auto';
      },
      'right-end': () => {
        top = targetRect.top + scrollY + targetRect.height - tooltipRect.height + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = tooltipRect.height - 20;
        arrowLeft = 'auto';
      },
    };

    if (placements[placement]) {
      placements[placement]();
    }

    const padding = 8;
    
    if (left < scrollX + padding) {
      if (placement.startsWith('left')) {
        finalPlacement = placement.replace('left', 'right');
        left = targetRect.right + scrollX + distance;
        arrowLeft = 'auto';
        if (finalPlacement === 'right') {
          arrowTop = 'auto';
        } else if (finalPlacement === 'right-start') {
          arrowTop = 12;
        } else if (finalPlacement === 'right-end') {
          arrowTop = tooltipRect.height - 12;
        }
      } else {
        left = scrollX + padding;
        if (placement.startsWith('top') || placement.startsWith('bottom')) {
          arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));
        }
      }
    } else if (left + tooltipRect.width > scrollX + viewportWidth - padding) {
      if (placement.startsWith('right')) {
        finalPlacement = placement.replace('right', 'left');
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowLeft = 'auto';
        if (finalPlacement === 'left') {
          arrowTop = 'auto';
        } else if (finalPlacement === 'left-start') {
          arrowTop = 12;
        } else if (finalPlacement === 'left-end') {
          arrowTop = tooltipRect.height - 12;
        }
      } else {
        left = scrollX + viewportWidth - tooltipRect.width - padding;
        if (placement.startsWith('top') || placement.startsWith('bottom')) {
          arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));
        }
      }
    }

    if (top < scrollY + padding) {
      if (placement.startsWith('top')) {
        finalPlacement = placement.replace('top', 'bottom');
        top = targetRect.bottom + scrollY + distance;
        arrowTop = -8;
      } else if (placement.startsWith('left') || placement.startsWith('right')) {
        top = scrollY + padding;
        if (finalPlacement === 'left' || finalPlacement === 'right') {
          arrowTop = 'auto';
        } else if (finalPlacement === 'left-start' || finalPlacement === 'right-start') {
          arrowTop = 12;
        } else if (finalPlacement === 'left-end' || finalPlacement === 'right-end') {
          arrowTop = tooltipRect.height - 12;
        }
      } else {
        top = scrollY + padding;
      }
    } else if (top + tooltipRect.height > scrollY + viewportHeight - padding) {
      if (placement.startsWith('bottom')) {
        finalPlacement = placement.replace('bottom', 'top');
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        arrowTop = tooltipRect.height;
      } else if (placement.startsWith('left') || placement.startsWith('right')) {
        top = scrollY + viewportHeight - tooltipRect.height - padding;
        if (finalPlacement === 'left' || finalPlacement === 'right') {
          arrowTop = 'auto';
        } else if (finalPlacement === 'left-start' || finalPlacement === 'right-start') {
          arrowTop = 12;
        } else if (finalPlacement === 'left-end' || finalPlacement === 'right-end') {
          arrowTop = tooltipRect.height - 12;
        }
      } else {
        top = scrollY + viewportHeight - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
    setArrowPosition({ top: arrowTop, left: arrowLeft });
  }, [placement, distance, skidding]);

  useEffect(() => {
    if (isOpen && !disabled) {
      setPosition({ top: -9999, left: -9999 }); // Ensure initial off-screen
      setArrowPosition({ top: 'auto', left: 'auto' });
      
      let lastWidth = 0;
      let lastHeight = 0;
      let stableCount = 0;
      
      const updatePosition = () => {
        if (tooltipRef.current && targetRef.current) {
          const tooltipRect = tooltipRef.current.getBoundingClientRect();
          if (tooltipRect.width > 0 && tooltipRect.height > 0) {
            if (tooltipRect.width === lastWidth && tooltipRect.height === lastHeight) {
              stableCount++;
              if (stableCount >= 2) {
                calculatePosition();
                if (!isVisible) {
                  setIsVisible(true);
                }
              } else {
                requestAnimationFrame(updatePosition);
              }
            } else {
              lastWidth = tooltipRect.width;
              lastHeight = tooltipRect.height;
              stableCount = 0;
              requestAnimationFrame(updatePosition);
            }
          } else {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                updatePosition();
              });
            });
          }
        }
      };

      const timeoutId = setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            updatePosition();
          });
        });
      }, 0);
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isVisible, disabled]);

  const handleShow = useCallback((immediate = false) => {
    if (disabled || isOpen) {
      return;
    }

    closeAllTooltips(instanceRef);

    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);

    if (immediate) {
      setIsOpen(true);
      isAnimatingRef.current = true;
      activeTooltips.add(instanceRef);
      onShow?.();

      requestAnimationFrame(() => {
        animationTimerRef.current = setTimeout(() => {
          isAnimatingRef.current = false;
          onAfterShow?.();
        }, 250);
      });
    } else {
      showTimerRef.current = setTimeout(() => {
        setIsOpen(true);
        isAnimatingRef.current = true;
        activeTooltips.add(instanceRef);
        onShow?.();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            animationTimerRef.current = setTimeout(() => {
              isAnimatingRef.current = false;
              onAfterShow?.();
            }, 250);
          });
        });
      }, showDelay);
    }
  }, [disabled, isOpen, showDelay, onShow, onAfterShow]);

  const handleHide = useCallback(() => {
    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);
    showTimerRef.current = null;

    if (!isOpen) {
      return;
    }

    hideTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = true;
      activeTooltips.delete(instanceRef);
      onHide?.();
      setIsVisible(false);

      animationTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        isAnimatingRef.current = false;
        onAfterHide?.();
      }, 250);
    }, hideDelay);
  }, [isOpen, hideDelay, onHide, onAfterHide]);

  const tooltipCallbackRef = useCallback((node) => {
    tooltipRef.current = node;
  }, []);

  useEffect(() => {
    if (isControlled) {
      if (controlledOpen && !disabled && !isOpen) {
        handleShow(true);
      } else if (!controlledOpen && isOpen) {
        handleHide();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledOpen, disabled, isControlled]);

  const triggers = useMemo(() => trigger.split(' ').filter(Boolean), [trigger]);

  const handleMouseEnter = useCallback(() => {
    if (triggers.includes('hover') && !isControlled) {
      handleShow();
    }
  }, [triggers, isControlled, handleShow]);

  const handleMouseLeave = useCallback(() => {
    if (triggers.includes('hover') && !isControlled) {
      handleHide();
    }
  }, [triggers, isControlled, handleHide]);

  const handleFocus = useCallback(() => {
    if (triggers.includes('focus') && !isControlled) {
      handleShow(true);
    }
  }, [triggers, isControlled, handleShow]);

  const handleBlur = useCallback(() => {
    if (triggers.includes('focus') && !isControlled) {
      handleHide();
    }
  }, [triggers, isControlled, handleHide]);

  const handleClick = useCallback((e) => {
    if (triggers.includes('click') && !isControlled) {
      e.preventDefault();
      e.stopPropagation();
      if (isOpen) {
        handleHide();
      } else {
        handleShow(true); // Abrir instantaneamente no clique
      }
    }
  }, [triggers, isControlled, isOpen, handleShow, handleHide]);

  // Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      clearTimeout(showTimerRef.current);
      clearTimeout(hideTimerRef.current);
      clearTimeout(animationTimerRef.current);
    };
  }, []);

  // Métodos imperativos
  useImperativeHandle(ref, () => {
    instanceRef.current.hide = handleHide;
    return {
      show: () => {
        if (!disabled) {
          handleShow(true);
        }
      },
      hide: () => {
        handleHide();
      },
    };
  }, [disabled, handleShow, handleHide]);

  useEffect(() => {
    return () => {
      activeTooltips.delete(instanceRef);
    };
  }, []);

  const tooltipId = useMemo(() => `tooltip-${Math.random().toString(36).slice(2, 11)}`, []);

  const targetElement = useMemo(() => {
    if (!children) return null;

    const child = React.Children.only(children);
    const isDisabled = child.props?.disabled;
    const isFocable = child.type === 'input' || child.type === 'button' || child.type === 'textarea' || child.type === 'select' || child.type === 'a';
    
    if (isDisabled) {
      const wrapperRef = (node) => {
        if (node) {
          targetRef.current = node.querySelector('button, input, select, textarea, a') || node.firstElementChild || node;
        }
      };

      const wrapperProps = {
        ref: wrapperRef,
        style: { display: 'inline-block' },
        'aria-describedby': isOpen ? tooltipId : undefined,
      };

      if (triggers.includes('hover')) {
        wrapperProps.onMouseEnter = handleMouseEnter;
        wrapperProps.onMouseLeave = handleMouseLeave;
      }

      if (triggers.includes('focus')) {
        wrapperProps.onFocus = handleFocus;
        wrapperProps.onBlur = handleBlur;
        wrapperProps.tabIndex = 0;
      }

      if (triggers.includes('click')) {
        wrapperProps.onClick = handleClick;
      }

      return (
        <span {...wrapperProps}>
          {child}
        </span>
      );
    }

    const childProps = {
      'aria-describedby': isOpen ? tooltipId : undefined,
    };

    if (triggers.includes('focus') && !isFocable && child.props?.tabIndex === undefined) {
      childProps.tabIndex = 0;
    }

    const originalRef = child.ref;
    if (originalRef) {
      childProps.ref = (node) => {
        targetRef.current = node;
        if (typeof originalRef === 'function') {
          originalRef(node);
        } else if (originalRef) {
          originalRef.current = node;
        }
      };
    } else {
      childProps.ref = targetRef;
    }

    if (triggers.includes('hover')) {
      const originalMouseEnter = child.props?.onMouseEnter;
      const originalMouseLeave = child.props?.onMouseLeave;
      childProps.onMouseEnter = (e) => {
        originalMouseEnter?.(e);
        handleMouseEnter();
      };
      childProps.onMouseLeave = (e) => {
        originalMouseLeave?.(e);
        handleMouseLeave();
      };
    }

    if (triggers.includes('focus')) {
      const originalFocus = child.props?.onFocus;
      const originalBlur = child.props?.onBlur;
      childProps.onFocus = (e) => {
        originalFocus?.(e);
        handleFocus();
      };
      childProps.onBlur = (e) => {
        originalBlur?.(e);
        handleBlur();
      };
      const originalKeyDown = child.props?.onKeyDown;
      childProps.onKeyDown = (e) => {
        originalKeyDown?.(e);
        if (e.key === 'Escape' && isOpen) {
          handleHide();
        }
      };
    }

    if (triggers.includes('click')) {
      const originalClick = child.props?.onClick;
      childProps.onClick = (e) => {
        originalClick?.(e);
        handleClick(e);
      };
    }

    return React.cloneElement(child, childProps);
  }, [children, triggers, isOpen, tooltipId, handleMouseEnter, handleMouseLeave, handleFocus, handleBlur, handleClick, handleHide]);

  const tooltipContent = isOpen && !disabled && content && (
    createPortal(
      <div
        ref={tooltipCallbackRef}
        id={tooltipId}
        role="tooltip"
        className={`${styles.tooltip} ${styles[`tooltip--${actualPlacement}`]} ${isVisible ? styles.visible : ''}`}
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          visibility: isVisible ? 'visible' : 'hidden',
        }}
      >
        {content}
        {!withoutArrow && (
          <div
            className={`${styles.arrow} ${
              (actualPlacement.startsWith('left-') || actualPlacement.startsWith('right-')) &&
              (actualPlacement.includes('-start') || actualPlacement.includes('-end'))
                ? styles[`arrow--${actualPlacement}`]
                : styles[`arrow--${actualPlacement.split('-')[0]}`]
            }`}
            style={{
              ...(arrowPosition.top !== 'auto' && { top: `${arrowPosition.top}px` }),
              ...(arrowPosition.left !== 'auto' && { left: `${arrowPosition.left}px` }),
            }}
          />
        )}
      </div>,
      document.body
    )
  );

  return (
    <>
      {targetElement}
      {tooltipContent}
    </>
  );
});

Tooltip.displayName = 'Tooltip';
