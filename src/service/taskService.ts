import { BaseApi } from "./baseApi";
import { ResponseDTO, Task } from "@/types";

const API = new BaseApi();

export class TaskService {
  async listarTarefas() {
    return await API.get<Task[]>("/tasks");
  }

  async visualizarTarefa(id: number) {
    return await API.get<Task>(`/tasks/${id}`);
  }

  async atualizarTarefa(id: number, name: string, cost: number, dueDate: string) {
    return await API.put(`/tasks/${id}`, {
      name,
      cost,
      dueDate,
    });
  }

  async deletarTarefa(id: number) {
    const res =  API.delete(`/tasks/${id}`);
    return res as Promise<ResponseDTO<Task>>;
  }

  async criarTarefa(name: string, cost: number, dueDate: string) {
    return await API.post(`/tasks`, {
      name,
      cost,
      dueDate,
    });
  }

  async atualizarOrdemTarefas(tasks: Task[]) {
    return await API.put(`/tasks/order`, tasks);
  }
}
