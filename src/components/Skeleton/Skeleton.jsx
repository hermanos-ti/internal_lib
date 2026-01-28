import styles from './Skeleton.module.css';
import React from 'react';

export const Skeleton = (props) => {
  const {
    variant = 'text', // 'text' | 'avatar' | 'card' | 'list' | 'custom'
    size = 'medium', // 'small' | 'medium' | 'large'
    width,
    height,
    rounded = 'md', // 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'pill'
    animation = 'pulse', // 'pulse' | 'wave' | 'shimmer' | 'none'
    count = 1,
    className = '',
  } = props;

  // Estilos inline para width e height customizados
  const customStyles = {};
  if (width) customStyles.width = width;
  if (height) customStyles.height = height;

  // Classes base
  const roundedClass = rounded ? styles[`skeleton__rounded-${rounded}`] : styles['skeleton__rounded-md'];
  const baseClasses = [
    styles.skeleton,
    styles[`skeleton__${size}`],
    roundedClass,
    animation !== 'none' ? styles[`skeleton__${animation}`] : '',
    className,
  ].filter(Boolean).join(' ');

  // Renderizar variante text
  const renderText = () => {
    const textRoundedClass = rounded ? styles[`skeleton__rounded-${rounded}`] : styles['skeleton__rounded-sm'];
    return (
      <div className={styles.skeleton__container}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${styles.skeleton__text} ${styles.skeleton__text__line} ${textRoundedClass} ${animation !== 'none' ? styles[`skeleton__${animation}`] : ''}`}
            style={index === 0 && width ? { width } : {}}
          />
        ))}
      </div>
    );
  };

  // Renderizar variante avatar
  const renderAvatar = () => {
    return (
      <div
        className={`${styles.skeleton} ${styles.skeleton__avatar} ${styles[`skeleton__avatar__${size}`]} ${styles['skeleton__rounded-full']} ${animation !== 'none' ? styles[`skeleton__${animation}`] : ''} ${className}`}
        style={customStyles}
      />
    );
  };

  // Renderizar variante card
  const renderCard = () => {
    const cardRoundedClass = rounded ? styles[`skeleton__rounded-${rounded}`] : styles['skeleton__rounded-lg'];
    const animationClass = animation !== 'none' ? styles[`skeleton__${animation}`] : '';
    return (
      <div
        className={`${styles.skeleton} ${styles.skeleton__card} ${cardRoundedClass}`}
        style={customStyles}
      >
        <div className={styles.skeleton__card__header}>
          <div
            className={`${styles.skeleton} ${styles.skeleton__avatar} ${styles.skeleton__avatar__medium} ${styles['skeleton__rounded-full']} ${animationClass}`}
          />
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__title} ${animationClass}`}
          />
        </div>
        <div className={styles.skeleton__card__content}>
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__line} ${animationClass}`}
          />
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__line} ${animationClass}`}
          />
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__line} ${animationClass}`}
          />
        </div>
        <div className={styles.skeleton__card__footer}>
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__button} ${animationClass}`}
          />
          <div
            className={`${styles.skeleton} ${styles.skeleton__card__button} ${animationClass}`}
          />
        </div>
      </div>
    );
  };

  // Renderizar variante list
  const renderList = () => {
    return (
      <div className={styles.skeleton__list}>
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={styles.skeleton__list__item}>
            <div
              className={`${styles.skeleton} ${styles.skeleton__list__avatar} ${styles['skeleton__rounded-full']} ${animation !== 'none' ? styles[`skeleton__${animation}`] : ''}`}
            />
            <div className={styles.skeleton__list__content}>
              <div
                className={`${styles.skeleton} ${styles.skeleton__list__title} ${animation !== 'none' ? styles[`skeleton__${animation}`] : ''}`}
              />
              <div
                className={`${styles.skeleton} ${styles.skeleton__list__subtitle} ${animation !== 'none' ? styles[`skeleton__${animation}`] : ''}`}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar variante custom
  const renderCustom = () => {
    return (
      <div
        className={baseClasses}
        style={customStyles}
      />
    );
  };

  // Renderizar baseado na variante
  switch (variant) {
    case 'text':
      return renderText();
    case 'avatar':
      return renderAvatar();
    case 'card':
      return renderCard();
    case 'list':
      return renderList();
    case 'custom':
      return renderCustom();
    default:
      return renderText();
  }
};
