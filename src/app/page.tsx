'use client';

import React, { useEffect, useState } from "react";
import { TaskService } from "@/service/taskService";
import { Task } from "@/types";
import { FaPlus, FaTrash, FaArrowUp, FaArrowDown } from "react-icons/fa6";
import dayjs from "dayjs";
import { toast, Toaster } from 'react-hot-toast';
import { BiSolidEditAlt } from "react-icons/bi";
import { Table, Button, Modal, Form, Input, InputNumber } from 'antd';

const taskService = new TaskService();

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>();
  const [modalVisible, setModalVisible] = useState(false);
  const [openCreateTaskModal, setOpenCreateTaskModal] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await taskService.listarTarefas();
      const orderedTasks = response?.sort((a, b) => a.displayOrder - b.displayOrder) || [];
      setTasks(orderedTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirm = window.confirm("Tem certeza que deseja excluir esta tarefa?");
    if (confirm) {
      await taskService.deletarTarefa(id);
      toast.success("Tarefa deletada com sucesso!");
      fetchTasks();
    }
  };

  const openEditModal = (task?: Task) => {
    setIsEditing(true);
    if (task) {
      setSelectedTask(task);
      form.setFieldsValue({ name: task.name, cost: task.cost, dueDate: task.dueDate });
    } else {
      setOpenCreateTaskModal(true);
      form.resetFields();
    }
    setModalVisible(true);
  };

  const closeEditModal = () => {
    setIsEditing(false);
    setSelectedTask(null);
    setModalVisible(false);
    setOpenCreateTaskModal(false);
    form.resetFields();
  };

  const handleFormSubmit = async (values: Task) => {
    const { name, cost, dueDate } = values;

    try {
      const existingTasks = await taskService.listarTarefas();
      const taskExists = existingTasks?.some(task => task.name === name && (!isEditing || task?.id !== selectedTask?.id)) ?? false;

      if (taskExists) {
        toast.error("Já existe uma tarefa com esse nome.");
        return;
      }

      if (isEditing && selectedTask) {
        await taskService.atualizarTarefa(selectedTask.id, name, cost, dueDate);
        toast.success("Tarefa atualizada com sucesso!");
      } else {
        await taskService.criarTarefa(name, cost, dueDate);
        toast.success("Tarefa criada com sucesso!");
      }

      fetchTasks();
      closeEditModal();
    } finally {
      setLoading(false);
    }
  };

  const moveTask = async (id: number, direction: 'up' | 'down') => {
    const index = tasks.findIndex(task => task.id === id);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < tasks.length - 1)) {
      const newTasks = [...tasks];
      const taskToMove = newTasks[index];
      newTasks.splice(index, 1);
      newTasks.splice(direction === 'up' ? index - 1 : index + 1, 0, taskToMove);

      const updatedTasks = newTasks.map((task, idx) => ({
        ...task,
        displayOrder: idx + 1,
      }));

      setTasks(updatedTasks);
      toast.success(`Tarefa movida ${direction === 'up' ? 'para cima' : 'para baixo'} com sucesso!`);
      await saveTaskOrder(updatedTasks);
    }
  };

  const saveTaskOrder = async (tasks: Task[]) => {
    try {
      await taskService.atualizarOrdemTarefas(tasks);
      toast.success("Ordem das tarefas atualizada com sucesso!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Nome da Tarefa',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Custo (R$)',
      dataIndex: 'cost',
      key: 'cost',
      render: (text: number) => `R$ ${text}`,
    },
    {
      title: 'Data Limite',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
    },
    {
      title: 'Ações',
      key: 'actions',
      render: (_: undefined, record: Task) => (
        <>
          <Button onClick={() => openEditModal(record)} icon={<BiSolidEditAlt />} type="link" />
          <Button onClick={() => handleDelete(record.id)} icon={<FaTrash />} type="link" danger />
          <Button onClick={() => moveTask(record.id, 'up')} disabled={record.id === tasks[0]?.id} type="link">
            <FaArrowUp />
          </Button>
          <Button onClick={() => moveTask(record.id, 'down')} disabled={record.id === tasks[tasks.length - 1]?.id} type="link">
            <FaArrowDown />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="container mx-auto p-4">
      <Toaster />
      <h1 className="text-2xl font-semibold mb-4">Lista de Tarefas</h1>
      <Button onClick={() => openEditModal()} className="mb-4" type="primary" icon={<FaPlus />}>
        Adicionar Tarefa
      </Button>
      <Table
        columns={columns}
        dataSource={tasks}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        rowClassName={(record: Task) => record.cost >= 1000 ? 'bg-yellow-100' : ''}
      />

      <Modal
        title={openCreateTaskModal ? "Criar Tarefa" : "Editar Tarefa"}
        open={modalVisible}
        onCancel={closeEditModal}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
        >
          <Form.Item
            label="Nome da Tarefa"
            name="name"
            rules={[{ required: true, message: 'Por favor, insira o nome da tarefa!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Custo (R$)"
            name="cost"
            rules={[{ required: true, message: 'Por favor, insira o custo!' }]}
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="Data Limite"
            name="dueDate"
            rules={[{ required: true, message: 'Por favor, insira a data limite!' }]}
          >
            <Input type="date" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {openCreateTaskModal ? "Criar Tarefa" : "Salvar Tarefa"}
            </Button>
            <Button onClick={closeEditModal} className="ml-2">
              Cancelar
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskList;
