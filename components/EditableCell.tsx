
import React, { useState, useEffect, useRef } from 'react';

interface EditableCellProps {
  value: any;
  onSave: (val: any) => void;
  type?: 'text' | 'number' | 'date';
  prefix?: string;
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({ 
  value, 
  onSave, 
  type = 'text', 
  prefix = '', 
  className = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>(String(value ?? ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(String(value ?? ''));
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== String(value ?? '')) {
      onSave(type === 'number' ? Number(localValue) : localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(String(value ?? ''));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full p-1 border-2 border-blue-400 outline-none rounded bg-white text-slate-800 ${className}`}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)}
      className={`p-2 cursor-pointer hover:bg-slate-50 rounded transition-colors min-h-[36px] flex items-center text-slate-700 ${className}`}
    >
      {prefix}{value}
    </div>
  );
};

export default EditableCell;
