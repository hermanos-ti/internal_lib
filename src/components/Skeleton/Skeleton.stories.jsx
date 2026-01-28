import React from 'react';
import { Skeleton } from './Skeleton';

export default {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Skeleton loader elegante e moderno para exibir placeholders durante o carregamento de conteúdo. Suporta múltiplos presets, tamanhos, animações e customizações.',
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'avatar', 'card', 'list', 'custom'],
      description: 'Preset do skeleton',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'Tamanho do skeleton',
    },
    rounded: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg', 'xl', 'full', 'pill'],
      description: 'Border radius',
    },
    animation: {
      control: 'select',
      options: ['pulse', 'wave', 'shimmer', 'none'],
      description: 'Tipo de animação',
    },
    count: {
      control: 'number',
      description: 'Número de elementos (para text e list)',
    },
    width: {
      control: 'text',
      description: 'Largura customizada (ex: "100%", "200px")',
    },
    height: {
      control: 'text',
      description: 'Altura customizada (ex: "20px", "100px")',
    },
  },
};

// Variantes
export const Text = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Skeleton variant="text" count={3} />
    </div>
  ),
};

export const Avatar = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      <Skeleton variant="avatar" size="small" />
      <Skeleton variant="avatar" size="medium" />
      <Skeleton variant="avatar" size="large" />
    </div>
  ),
};

export const Card = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Skeleton variant="card" />
    </div>
  ),
};

export const List = {
  render: () => (
    <div style={{ width: '400px' }}>
      <Skeleton variant="list" count={5} />
    </div>
  ),
};

export const Custom = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '400px' }}>
      <Skeleton variant="custom" width="100%" height="40px" />
      <Skeleton variant="custom" width="80%" height="20px" />
      <Skeleton variant="custom" width="60%" height="20px" />
    </div>
  ),
};

// Tamanhos
export const Sizes = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Small</p>
        <Skeleton variant="text" size="small" count={2} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Medium</p>
        <Skeleton variant="text" size="medium" count={2} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Large</p>
        <Skeleton variant="text" size="large" count={2} />
      </div>
    </div>
  ),
};

// Animações
export const Animations = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '400px' }}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Pulse</p>
        <Skeleton variant="text" animation="pulse" count={3} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Wave</p>
        <Skeleton variant="text" animation="wave" count={3} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Shimmer</p>
        <Skeleton variant="text" animation="shimmer" count={3} />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b', fontWeight: '500' }}>None</p>
        <Skeleton variant="text" animation="none" count={3} />
      </div>
    </div>
  ),
};

// Border Radius
export const BorderRadius = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '400px' }}>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>None</p>
        <Skeleton variant="custom" width="100%" height="40px" rounded="none" />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Small</p>
        <Skeleton variant="custom" width="100%" height="40px" rounded="sm" />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Medium</p>
        <Skeleton variant="custom" width="100%" height="40px" rounded="md" />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Large</p>
        <Skeleton variant="custom" width="100%" height="40px" rounded="lg" />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Extra Large</p>
        <Skeleton variant="custom" width="100%" height="40px" rounded="xl" />
      </div>
      <div>
        <p style={{ marginBottom: '8px', fontSize: '14px', color: '#64748b' }}>Full (Circle)</p>
        <Skeleton variant="custom" width="80px" height="80px" rounded="full" />
      </div>
    </div>
  ),
};

// Casos de Uso Reais
export const CardLoading = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ width: '300px' }}>
          <Skeleton variant="card" animation="wave" />
        </div>
      ))}
    </div>
  ),
};

export const ListLoading = {
  render: () => (
    <div style={{ width: '500px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
      <Skeleton variant="list" count={6} animation="shimmer" />
    </div>
  ),
};

export const ProfileLoading = {
  render: () => (
    <div style={{ width: '400px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Skeleton variant="avatar" size="large" animation="wave" />
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Skeleton variant="custom" width="60%" height="20px" animation="pulse" />
          <Skeleton variant="custom" width="40%" height="16px" animation="pulse" />
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton variant="text" count={4} animation="shimmer" />
      </div>
    </div>
  ),
};

export const ArticleLoading = {
  render: () => (
    <div style={{ width: '600px', padding: '24px' }}>
      <div style={{ marginBottom: '16px' }}>
        <Skeleton variant="custom" width="100%" height="32px" rounded="md" animation="wave" />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <Skeleton variant="custom" width="40%" height="20px" rounded="md" animation="pulse" />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <Skeleton variant="text" count={5} animation="shimmer" />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <Skeleton variant="custom" width="100%" height="200px" rounded="lg" animation="wave" />
      </div>
      <div>
        <Skeleton variant="text" count={4} animation="shimmer" />
      </div>
    </div>
  ),
};