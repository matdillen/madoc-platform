import styled from 'styled-components';
import * as React from 'react';
import { LocaleString } from '../components/LocaleString';
import { InternationalString } from '@iiif/presentation-3';
import { useState } from 'react';
import { ChevronDown } from '../icons/ChevronIcon';

export const AccordionWrapper = styled.div`
  background-color: inherit;
  width: 100%;

  hr {
    color: rgba(150, 141, 141, 0.26);
  }
`;

export const Top = styled.button`
  width: 100%;
  background-color: inherit;
  border: none;
  cursor: pointer;
  border-radius: 3px;

  display: flex;
  justify-content: space-between;
  padding: 0.3em;

  :hover {
    background-color: rgba(59, 59, 93, 0.1);
  }

  svg {
    height: 1.5em;
    width: 1.5em;
    transition: all 0.5s ease;
    margin-top: auto;
    margin-bottom: auto;

    &[data-is-open='true'] {
      transform: rotatex(180deg);
    }
  }
`;

export const Title = styled.h3`
  text-transform: capitalize;
`;

export const Content = styled.div`
  width: 100%;
  background-color: white;
  overflow: hidden;
  max-height: 0;
  transition: max-height ease-in-out 0.4s;

  &[data-is-open='true'] {
    overflow: auto;
    max-height: 2000px;
  }
`;

interface AccordionProps {
  children: React.ReactNode;
  title?: InternationalString;
  defaultOpen?: boolean;
}
export const Accordion = ({ title, children, defaultOpen = true }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <AccordionWrapper>
      <Top
        onClick={() => {
          setIsOpen(!isOpen);
        }}
      >
        <Title>
          <LocaleString>{title}</LocaleString>
        </Title>
        <ChevronDown data-is-open={isOpen} />
      </Top>
      <Content data-is-open={isOpen}>{children}</Content>
      <hr />
    </AccordionWrapper>
  );
};