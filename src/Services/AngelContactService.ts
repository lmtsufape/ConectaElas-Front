import api from "./api";

export interface AngelContact {
  id: number;
  Nome: string;
  Numero: string;
}

const AngelContactService = {
  async fetchContacts(
    authToken: string,
    userId: number
  ): Promise<AngelContact[]> {
    try {
      const response = await api.get(
        `/contato-do-anjos?populate=*&filters[usuario][id][$eq]=${userId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error("Erro ao buscar contatos do anjo:", error);
      return [];
    }
  },

  async addContact(
    authToken: string,
    nome: string,
    numero: string,
    userId: number
  ): Promise<boolean> {
    try {
      await api.post(
        "/contato-do-anjos",
        {
          data: {
            Nome: nome,
            Numero: numero,
            usuario: {
              id: userId,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      return true;
    } catch (error) {
      console.error("Erro ao adicionar contato do anjo:", error);
      return false;
    }
  },

  async deleteContact(authToken: string, contactId: number): Promise<boolean> {
    try {
      console.log(`Enviando DELETE para /api/contato-do-anjos/${contactId}`);

      await api.delete(`contato-do-anjos/${contactId}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log("Contato removido com sucesso da API!");
      return true;
    } catch (error) {
      console.error("Erro ao excluir contato do anjo:", error);
      return false;
    }
  },
};

export default AngelContactService;
