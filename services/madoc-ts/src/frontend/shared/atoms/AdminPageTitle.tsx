import styled, { css } from 'styled-components';

export const AdminPageTitle = styled.h1<{ subtitle?: boolean }>`
  display: block;
  color: #fff;
  font-size: 1.8em;
  padding: 1.3em 0;
  font-weight: normal;
  margin: 0;
  background: #25416b;
  ${props =>
    props.subtitle &&
    css`
      padding-bottom: 0.2em;
    `}
`;

export const AdminPageSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.7);
  padding-bottom: 2em;
`;

export default AdminPageTitle;
