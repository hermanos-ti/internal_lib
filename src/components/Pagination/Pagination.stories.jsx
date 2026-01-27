import { Pagination } from './Pagination';
import '../../assets/icons/css/all.css';
import { useState } from 'react';

export default {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Componente de paginação para navegação entre páginas e controle de itens por página.',
      },
    },
  },
};

// Exemplo básico
export const Default = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 10;

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    );
  },
};

// Exemplo com seletor de itens por página
export const ComItensPorPagina = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const totalItems = 250;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1); // Resetar para primeira página ao mudar itens por página
        }}
        itemsPerPageOptions={[10, 25, 50, 100]}
      />
    );
  },
};

// Exemplo na primeira página (botões desabilitados)
export const PrimeiraPagina = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5;

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    );
  },
};

// Exemplo na última página (botões desabilitados)
export const UltimaPagina = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(10);
    const totalPages = 10;

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    );
  },
};

// Exemplo com muitas páginas
export const MuitasPaginas = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(50);
    const totalPages = 100;

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    );
  },
};

// Exemplo sem páginas (totalPages = 0)
export const SemPaginas = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 0;

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
      />
    );
  },
};

// Exemplo com opções customizadas de itens por página
export const OpcoesCustomizadas = {
  render: () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const totalItems = 100;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    return (
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={(page) => setCurrentPage(page)}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={(newItemsPerPage) => {
          setItemsPerPage(newItemsPerPage);
          setCurrentPage(1);
        }}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />
    );
  },
};

