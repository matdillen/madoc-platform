import styled from 'styled-components';

export const Button = styled.button`
  cursor: pointer;
  font-size: 16px;
  line-height: 22px;
  padding: 3px 10px;
  background: #4e82df;
  color: #fff;
  border: 2px solid #4e82df;
  border-bottom-width: 3px;
  text-decoration: none;
  &:link,
  &:visited {
    color: #fff;
  }
  &:hover {
    background: #7baaff;
    border-color: #7baaff;
  }
  &:focus {
    outline: 2px solid #42a0db;
  }
  &:disabled {
    opacity: 0.7;
  }
`;

export const SmallButton = styled(Button)`
  font-size: 12px;
  line-height: 14px;
  padding: 2px 10px;
`;

export const TinyButton = SmallButton;

export const LinkButton = styled.button`
  border: none;
  outline: none;
  background: transparent;
  margin: 0;
  padding: 0;
  font-size: inherit;
  color: #5071f4;
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: #42a0db;
  }
`;

export const ButtonRow = styled.div`
  margin: 1em 0;
  ${Button} ~ ${Button} {
    margin-left: .5em;
  }
`;
