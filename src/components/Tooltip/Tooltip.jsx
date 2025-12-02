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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [arrowPosition, setArrowPosition] = useState({ top: 'auto', left: 'auto' });

  const targetRef = useRef(null);
  const tooltipRef = useRef(null);
  const showTimerRef = useRef(null);
  const hideTimerRef = useRef(null);
  const animationTimerRef = useRef(null);
  const isControlled = controlledOpen !== undefined;
  const isAnimatingRef = useRef(false);
  const instanceRef = useRef({ hide: null });

  // Função para calcular posição do tooltip
  const calculatePosition = useCallback(() => {
    if (!targetRef.current || !tooltipRef.current) return;

    const targetRect = targetRef.current.getBoundingClientRect();
    let tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Se o tooltip ainda não está visível, usar dimensões estimadas
    if (tooltipRect.width === 0 || tooltipRect.height === 0) {
      tooltipRef.current.style.visibility = 'hidden';
      tooltipRef.current.style.display = 'block';
      tooltipRect = tooltipRef.current.getBoundingClientRect();
      tooltipRef.current.style.visibility = '';
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
        arrowLeft = 12;
      },
      'top-end': () => {
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        left = targetRect.left + scrollX + targetRect.width - tooltipRect.width + skidding;
        arrowTop = tooltipRect.height;
        arrowLeft = tooltipRect.width - 12;
      },
      bottom: () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + targetRect.width / 2 - tooltipRect.width / 2 + skidding;
        arrowTop = -8;
        arrowLeft = tooltipRect.width / 2;
      },
      'bottom-start': () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + skidding;
        arrowTop = -8;
        arrowLeft = 12;
      },
      'bottom-end': () => {
        top = targetRect.bottom + scrollY + distance;
        left = targetRect.left + scrollX + targetRect.width - tooltipRect.width + skidding;
        arrowTop = -8;
        arrowLeft = tooltipRect.width - 12;
      },
      left: () => {
        top = targetRect.top + scrollY + targetRect.height / 2 - tooltipRect.height / 2 + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = tooltipRect.height / 2 - 8;
        arrowLeft = tooltipRect.width;
      },
      'left-start': () => {
        top = targetRect.top + scrollY + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = 12 - 8;
        arrowLeft = tooltipRect.width;
      },
      'left-end': () => {
        top = targetRect.top + scrollY + targetRect.height - tooltipRect.height + skidding;
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowTop = tooltipRect.height - 12 - 8;
        arrowLeft = tooltipRect.width;
      },
      right: () => {
        top = targetRect.top + scrollY + targetRect.height / 2 - tooltipRect.height / 2 + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = tooltipRect.height / 2;
        arrowLeft = -8;
      },
      'right-start': () => {
        top = targetRect.top + scrollY + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = 12;
        arrowLeft = -8;
      },
      'right-end': () => {
        top = targetRect.top + scrollY + targetRect.height - tooltipRect.height + skidding;
        left = targetRect.right + scrollX + distance;
        arrowTop = tooltipRect.height - 12;
        arrowLeft = -8;
      },
    };

    if (placements[placement]) {
      placements[placement]();
    }

    // Ajustar para manter dentro do viewport
    const padding = 8;
    
    // Ajustar horizontalmente
    if (left < scrollX + padding) {
      if (placement.startsWith('left')) {
        // Mudar para right
        finalPlacement = placement.replace('left', 'right');
        left = targetRect.right + scrollX + distance;
        arrowLeft = -8;
        // Recalcular arrowTop baseado no novo placement
        if (finalPlacement === 'right') {
          arrowTop = tooltipRect.height / 2 - 8;
        } else if (finalPlacement === 'right-start') {
          arrowTop = 12 - 8;
        } else if (finalPlacement === 'right-end') {
          arrowTop = tooltipRect.height - 12 - 8;
        }
      } else {
        left = scrollX + padding;
        if (placement.startsWith('top') || placement.startsWith('bottom')) {
          arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));
        }
      }
    } else if (left + tooltipRect.width > scrollX + viewportWidth - padding) {
      if (placement.startsWith('right')) {
        // Mudar para left
        finalPlacement = placement.replace('right', 'left');
        left = targetRect.left + scrollX - tooltipRect.width - distance;
        arrowLeft = tooltipRect.width;
        // Recalcular arrowTop baseado no novo placement
        if (finalPlacement === 'left') {
          arrowTop = tooltipRect.height / 2 - 8;
        } else if (finalPlacement === 'left-start') {
          arrowTop = 12 - 8;
        } else if (finalPlacement === 'left-end') {
          arrowTop = tooltipRect.height - 12 - 8;
        }
      } else {
        left = scrollX + viewportWidth - tooltipRect.width - padding;
        if (placement.startsWith('top') || placement.startsWith('bottom')) {
          arrowLeft = Math.max(12, Math.min(arrowLeft, tooltipRect.width - 12));
        }
      }
    }

    // Ajustar verticalmente
    if (top < scrollY + padding) {
      if (placement.startsWith('top')) {
        // Mudar para bottom
        finalPlacement = placement.replace('top', 'bottom');
        top = targetRect.bottom + scrollY + distance;
        arrowTop = -8;
      } else if (placement.startsWith('left') || placement.startsWith('right')) {
        top = scrollY + padding;
        // Ajustar arrowTop para manter proporção
        if (placement === 'left' || placement === 'right') {
          arrowTop = Math.max(12 - 8, Math.min(arrowTop, tooltipRect.height - 12 - 8));
        }
      } else {
        top = scrollY + padding;
      }
    } else if (top + tooltipRect.height > scrollY + viewportHeight - padding) {
      if (placement.startsWith('bottom')) {
        // Mudar para top
        finalPlacement = placement.replace('bottom', 'top');
        top = targetRect.top + scrollY - tooltipRect.height - distance;
        arrowTop = tooltipRect.height;
      } else if (placement.startsWith('left') || placement.startsWith('right')) {
        top = scrollY + viewportHeight - tooltipRect.height - padding;
        // Ajustar arrowTop para manter proporção
        if (placement === 'left' || placement === 'right') {
          arrowTop = Math.max(12 - 8, Math.min(arrowTop, tooltipRect.height - 12 - 8));
        }
      } else {
        top = scrollY + viewportHeight - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
    setArrowPosition({ top: arrowTop, left: arrowLeft });
  }, [placement, distance, skidding]);

  // Atualizar posição quando necessário
  useEffect(() => {
    if (isOpen && !disabled) {
      const updatePosition = () => {
        if (tooltipRef.current && targetRef.current) {
          // Aguardar tooltip ser renderizado
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              calculatePosition();
            });
          });
        }
      };

      // Aguardar um pouco mais para garantir que o tooltip foi renderizado
      const timeoutId = setTimeout(updatePosition, 0);
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);

      return () => {
        clearTimeout(timeoutId);
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, isVisible, disabled, calculatePosition]);

  const handleShow = useCallback(() => {
    if (disabled || isOpen) return;

    // Fechar todos os outros tooltips antes de abrir este
    closeAllTooltips(instanceRef);

    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);

    showTimerRef.current = setTimeout(() => {
      setIsOpen(true);
      isAnimatingRef.current = true;
      activeTooltips.add(instanceRef);
      onShow?.();

      // Aguardar próximo frame para aplicar animação
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
          
          // Aguardar animação completar
          animationTimerRef.current = setTimeout(() => {
            isAnimatingRef.current = false;
            onAfterShow?.();
          }, 150); // Duração da animação CSS
        });
      });
    }, showDelay);
  }, [disabled, isOpen, showDelay, onShow, onAfterShow]);

  const handleHide = useCallback(() => {
    if (!isOpen) return;

    clearTimeout(showTimerRef.current);
    clearTimeout(hideTimerRef.current);

    hideTimerRef.current = setTimeout(() => {
      isAnimatingRef.current = true;
      activeTooltips.delete(instanceRef);
      onHide?.();
      setIsVisible(false);

      // Aguardar animação completar antes de remover do DOM
      animationTimerRef.current = setTimeout(() => {
        setIsOpen(false);
        isAnimatingRef.current = false;
        onAfterHide?.();
      }, 150); // Duração da animação CSS
    }, hideDelay);
  }, [isOpen, hideDelay, onHide, onAfterHide]);

  // Callback ref para tooltip - calcular posição quando montado
  const tooltipCallbackRef = useCallback((node) => {
    tooltipRef.current = node;
    if (node && targetRef.current) {
      // Calcular posição após tooltip ser montado
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (tooltipRef.current && targetRef.current) {
            calculatePosition();
          }
        });
      });
    }
  }, [calculatePosition]);

  // Sincronizar prop open com estado interno
  useEffect(() => {
    if (isControlled) {
      if (controlledOpen && !disabled && !isOpen) {
        handleShow();
      } else if (!controlledOpen && isOpen) {
        handleHide();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledOpen, disabled, isControlled]);

  // Handlers de eventos
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
      handleShow();
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
        handleShow();
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
          handleShow();
        }
      },
      hide: () => {
        handleHide();
      },
    };
  }, [disabled, handleShow, handleHide]);

  // Limpar do registro ao desmontar
  useEffect(() => {
    return () => {
      activeTooltips.delete(instanceRef);
    };
  }, []);

  // Gerar ID único para aria-describedby
  const tooltipId = useMemo(() => `tooltip-${Math.random().toString(36).slice(2, 11)}`, []);

  // Clonar children com ref e event handlers
  const targetElement = useMemo(() => {
    if (!children) return null;

    const child = React.Children.only(children);
    const isDisabled = child.props?.disabled;
    const isFocable = child.type === 'input' || child.type === 'button' || child.type === 'textarea' || child.type === 'select' || child.type === 'a';
    
    // Se o elemento está disabled, precisamos envolver em um wrapper
    if (isDisabled) {
      const wrapperRef = (node) => {
        // targetRef deve apontar para o elemento disabled dentro do wrapper
        if (node) {
          targetRef.current = node.querySelector('button, input, select, textarea, a') || node.firstElementChild || node;
        }
      };

      const wrapperProps = {
        ref: wrapperRef,
        style: { display: 'inline-block' },
        'aria-describedby': isOpen ? tooltipId : undefined,
      };

      // Adicionar handlers no wrapper
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

    // Se trigger inclui focus e elemento não é focável, adicionar tabIndex
    if (triggers.includes('focus') && !isFocable && child.props?.tabIndex === undefined) {
      childProps.tabIndex = 0;
    }

    // Combinar refs se já existir uma
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

    // Combinar event handlers existentes
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
      // Adicionar suporte para ESC quando em foco
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

  // Renderizar tooltip
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
        }}
      >
        {content}
        {!withoutArrow && (
          <div
            className={`${styles.arrow} ${styles[`arrow--${actualPlacement.split('-')[0]}`]}`}
            style={{
              top: arrowPosition.top !== 'auto' ? `${arrowPosition.top}px` : 'auto',
              left: arrowPosition.left !== 'auto' ? `${arrowPosition.left}px` : 'auto',
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
