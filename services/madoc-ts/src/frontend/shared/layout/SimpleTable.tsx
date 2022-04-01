import styled, { css } from 'styled-components';

const Table = styled.table`
  width: 100%;
  border: 1px solid #eee;
  border-collapse: collapse;
`;

const Row = styled.tr<{ $interactive?: boolean }>`
  border-bottom: 1px solid #eee;
  ${props =>
    props.$interactive &&
    css`
      &:hover {
        background: #f9f9f9;
      }
    `}
`;

const Cell = styled.td`
  padding: 0.65em;
  border-collapse: collapse;
`;

const Header = styled.th`
  padding: 0.65em;
  border-collapse: collapse;
  font-weight: 600;
  border-bottom: 1px solid #eee;
`;

export const SimpleTable = {
  Table,
  Row,
  Cell,
  Header,
};
