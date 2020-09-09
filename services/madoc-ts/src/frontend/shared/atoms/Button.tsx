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
    cursor: not-allowed;
    &:hover {
      background: #4e82df;
      border-color: #4e82df;
    }
  }
`;

export const RoundedButton = styled.a`
  cursor: pointer;
  font-size: 16px;
  line-height: 22px;
  padding: 3px 10px;
  background: #ffffff;
  color: #007bff;
  border: 1px solid #dee2e6;
  text-decoration: none;

  &:link,
  &:visited {
    color: #007bff;
  }
  &:hover {
    background: #ffffff;
    border-color: #dee2e6;
  }
  &:focus {
    outline: 1px solid #dee2e6;
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    &:hover {
      background: #4e82df;
      border-color: #dee2e6;
    }
  }
  &:last-of-type {
    border-radius: 0px 4px 4px 0px;
  }
  &:first-of-type {
    border-radius: 4px 0px 0px 4px;
  }
`;

export const SmallButton = styled(Button)`
  font-size: 12px;
  line-height: 14px;
  padding: 2px 10px;
`;

export const SmallRoundedButton = styled(RoundedButton)`
  font-size: 12px;
  line-height: 14px;
  padding: 2px 10px;
`;

export const TinyButton = SmallButton;

export const LinkButton = styled.button<{ $inherit?: boolean }>`
  border: none;
  outline: none;
  background: transparent;
  margin: 0;
  padding: 0;
  font-size: inherit;
  color: ${props => (props.$inherit ? 'inherit' : '#5071f4')};
  text-decoration: underline;
  cursor: pointer;
  &:hover {
    color: ${props => (props.$inherit ? 'inherit' : '#42a0db')};
  }
`;

export const ButtonRow = styled.div`
  margin: 1em 0;
  ${Button} ~ ${Button} {
    margin-left: .5em;
  }
`;
