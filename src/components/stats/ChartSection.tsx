import { Paper, Title } from "@mantine/core";
import { PropsWithChildren, ReactNode } from "react";
import SectionInfo from "./SectionInfo";
import classes from "./ChartSection.module.css";

export default function ChartSection({
  id,
  title,
  info,
  children,
}: PropsWithChildren<{ id: string; title: ReactNode; info?: ReactNode }>) {
  return (
    <Paper className={classes.section} radius="md" p="lg" mb="lg">
      <div className={classes.heading}>
        <SectionInfo
          heading={
            <Title id={id} order={3}>
              {title}
            </Title>
          }
          info={info}
        />
      </div>
      {children}
    </Paper>
  );
}
