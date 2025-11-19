package com.partricioturismo.crud.dtos;

public class AssentoLayoutDto {
    private String numero;   // Ex: "01", "44" ou null (se for espaço vazio)
    private String tipo;     // "JANELA", "CORREDOR", "VAZIO"
    private Boolean ocupado; // Reservado para uso futuro

    public AssentoLayoutDto() {
    }

    public AssentoLayoutDto(String numero, String tipo) {
        this.numero = numero;
        this.tipo = tipo;
        this.ocupado = false;
    }

    public String getNumero() { return numero; }
    public void setNumero(String numero) { this.numero = numero; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public Boolean getOcupado() { return ocupado; }
    public void setOcupado(Boolean ocupado) { this.ocupado = ocupado; }
}