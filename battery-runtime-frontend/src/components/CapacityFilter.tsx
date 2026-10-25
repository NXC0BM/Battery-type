import "./CapacityFilter.css";
import { FC } from "react";
import { Button, Form } from "react-bootstrap";

interface Props {
  value: number;
  setValue: (value: number) => void;
  onSubmit: () => void;
  loading?: boolean;
}

export const MIN_CAPACITY = 0;
export const MAX_CAPACITY = 5000;

// Фильтр по минимальной ёмкости: слайдер с числовым значением и кнопка применения
export const CapacityFilter: FC<Props> = ({ value, setValue, onSubmit, loading }) => (
  <div className="capacityFilter">
    <div className="capacityFilterLabel">Ёмкость от, мА·ч</div>
    <div className="capacityFilterRow">
      <Form.Range
        min={MIN_CAPACITY}
        max={MAX_CAPACITY}
        step={100}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
      />
      <span className="capacityFilterValue">{value}</span>
    </div>
    <Button className="capacityFilterButton" disabled={loading} onClick={onSubmit}>
      Показать
    </Button>
  </div>
);
