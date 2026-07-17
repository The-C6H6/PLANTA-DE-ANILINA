# Diseño conceptual de una planta industrial de anilina

<div align="center">

**Hidrogenación catalítica de nitrobenceno · 33 000 t/año · Coatzacoalcos, Veracruz**

Proyecto técnico-académico de diseño de planta que integra simulación en Aspen HYSYS, balances de materia y energía, red de integración térmica, P&ID, especificación preliminar de equipos, estimación económica, layout SLP y visualización 3D interactiva.

[**Reporte técnico**](<REPORTE/ANILINA___EQUIPO 6.pdf>) · [**Recorrido 3D**](<3D/VISUALIZACIÓN/GRABACIÓN 3D.mp4>) · [**Modelo interactivo**](<3D/index.standalone.html>) · [**Caso de HYSYS**](<SIMULACIÓN/ANILINA_99.hsc>)

</div>

![Vista isométrica de la planta de producción de anilina](<3D/LAYOUT/visualisacion realista LAYOUT.png>)

> [!IMPORTANT]
> Este es un diseño conceptual con fines académicos. Los datos de proceso, seguridad y costos deben someterse a ingeniería básica y de detalle, HAZOP/LOPA, revisión normativa y validación independiente antes de cualquier uso industrial.

## Contenido

- [Visión general](#visión-general)
- [Fundamento químico](#fundamento-químico)
- [Proceso completo](#proceso-completo)
- [Diagramas de ingeniería y simulación](#diagramas-de-ingeniería-y-simulación)
- [Layout y diseño 3D](#layout-y-diseño-3d)
- [Equipos principales](#equipos-principales)
- [Seguridad y criterios de distribución](#seguridad-y-criterios-de-distribución)
- [Contenido del repositorio](#contenido-del-repositorio)
- [Cómo explorar el proyecto](#cómo-explorar-el-proyecto)
- [Alcance y limitaciones](#alcance-y-limitaciones)

## Visión general

La propuesta desarrolla una planta de operación continua para producir **anilina grado técnico** mediante la hidrogenación catalítica de nitrobenceno. El diseño considera recuperación de materias primas no reaccionadas, integración térmica, separación gas-líquido, decantación, purificación por destilación y manejo final del producto.

La localización conceptual es el entorno industrial del **Complejo Petroquímico Pajaritos, Coatzacoalcos, Veracruz, México**, seleccionado por su infraestructura petroquímica, acceso logístico y cercanía potencial a materias primas y servicios.

| Indicador | Valor de diseño o simulación |
| --- | ---: |
| Producto principal | Anilina grado técnico |
| Capacidad nominal | 33 000 t/año |
| Producción simulada | 32 268.45 t/año |
| Producción horaria | 3.841482 t/h |
| Régimen de operación | 350 días/año; 8 400 h/año |
| Conversión en el reactor | 96 % |
| Pureza molar del producto | 97.7 % |
| Presión aproximada de reacción | 5 bar |
| Temperatura de entrada al reactor | 340 °C |
| Inversión total preliminar | USD 4 070 400 |
| Materias primas | USD 57 161 700/año |
| Servicios auxiliares | USD 1 135 841.82/año |

Los valores económicos corresponden a la estimación académica del proyecto y no representan cotizaciones vigentes de mercado.

## Fundamento químico

La reacción principal es la reducción del grupo nitro del nitrobenceno con hidrógeno:

```text
C6H5NO2 + 3 H2  →  C6H5NH2 + 2 H2O
Nitrobenceno        Anilina       Agua
```

- **Materia prima orgánica:** nitrobenceno.
- **Agente reductor:** hidrógeno.
- **Catalizador considerado:** paladio soportado en alúmina.
- **Producto:** anilina.
- **Subproducto estequiométrico:** agua.
- **Naturaleza del sistema:** reacción exotérmica en fase gaseosa, con control térmico y recuperación de calor.

## Proceso completo

### 1. Alimentación y recuperación de materias primas

El nitrobenceno fresco se combina con el nitrobenceno recuperado en la sección de purificación. En paralelo, el hidrógeno fresco se mezcla con el hidrógeno recirculado desde el separador gas-líquido. Estos reciclos disminuyen pérdidas de reactivos y reducen la demanda de alimentación fresca.

### 2. Precalentamiento e integración térmica

La corriente total de hidrógeno se precalienta en **E-101** hasta aproximadamente 220 °C aprovechando energía del efluente caliente del reactor; después alcanza cerca de 310 °C con servicio de calentamiento. El nitrobenceno sigue un acondicionamiento equivalente mediante recuperación de calor y calentamiento final hasta aproximadamente 310 °C.

### 3. Mezcla, compresión y reacción

Las alimentaciones calientes se mezclan y se comprimen hasta cerca de 5 bar. Antes de ingresar al reactor catalítico **CRV-100**, la mezcla alcanza aproximadamente 340 °C. La conversión de nitrobenceno establecida en la simulación es de 96 %. Debido al carácter exotérmico de la reacción, el reactor requiere control de temperatura y una estrategia de remoción de calor.

### 4. Enfriamiento y recuperación de hidrógeno

El efluente del reactor, compuesto por anilina, agua, hidrógeno y nitrobenceno no reaccionados, entrega parte de su energía a las corrientes frías del proceso. Posteriormente se enfría hasta unos 30 °C y entra al separador **V-101**. La fase gaseosa rica en H₂ se divide entre una purga de seguridad hacia antorcha y una corriente de recirculación.

### 5. Decantación de la fase líquida

La fase líquida pasa al decantador **V-100**, donde se separa una fase acuosa de una fase orgánica rica en anilina y nitrobenceno. La separación líquido-líquido reduce la carga de agua que llegará a la destilación.

### 6. Primera etapa de destilación

La fase orgánica se acondiciona a unos 110 °C antes de entrar a **T-101**. Esta columna retira agua residual, compuestos ligeros e impurezas. Una segunda decantación en **V-102** recupera la fracción orgánica presente en la corriente superior.

### 7. Purificación final y reciclo de nitrobenceno

Las corrientes orgánicas recuperadas se combinan en **MIX-102** y alimentan la segunda columna, **T-100**. La columna opera al vacío, aproximadamente a 0.05 atm en el modelo, para efectuar la separación final anilina-nitrobenceno. La anilina sale como producto con una pureza aproximada de 97.7 % mol; el nitrobenceno de fondos regresa al inicio del proceso.

### 8. Almacenamiento, envasado y despacho

El producto purificado se dirige a tanques con blanketing de nitrógeno, seguido de envasado en tambores metálicos o carga a transporte. El layout incorpora laboratorio, sala de control, servicios auxiliares, mantenimiento y tratamiento de efluentes.

## Diagramas de ingeniería y simulación

### Diagrama de bloques

La vista de bloques resume la trayectoria principal y muestra los dos lazos de recuperación: **A** para nitrobenceno y **B** para hidrógeno.

![Diagrama de bloques del proceso de anilina](docs/readme-assets/diagrama-bloques.png)

[Abrir el diagrama de bloques original en PDF](<DIAGRAMAS/Bloques Anilina.pdf>)

### Diagrama de flujo sin integración térmica

Esta representación identifica los equipos principales y permite seguir el proceso base antes de incorporar los intercambios de energía entre corrientes.

![Diagrama de flujo del proceso sin integración térmica](docs/readme-assets/diagrama-flujo-proceso.png)

[Abrir el diagrama de flujo original en PDF](<DIAGRAMAS/Diagrama de flujo sin integración termica.pdf>)

### Red de Integración Térmica (RIT)

La RIT aprovecha el efluente caliente del reactor para precalentar corrientes de alimentación. En particular, **E-101** recupera calor para el hidrógeno y la red asociada a **E-106** reduce la carga térmica del acondicionamiento de nitrobenceno/mezcla reactiva. Los calentadores y enfriadores de servicio completan los niveles de temperatura requeridos.

![Red de integración térmica de la planta de anilina](DIAGRAMAS/RIT.jpg)

[Abrir el archivo editable de la RIT](DIAGRAMAS/RIT.eddx)

### Simulación en Aspen HYSYS

El flowsheet integra alimentaciones frescas, reciclos, reactor de conversión, separadores, decantadores, columnas y corrientes de energía. Los archivos de simulación permiten consultar propiedades, composiciones y resultados del caso.

![Flowsheet de simulación en Aspen HYSYS](docs/readme-assets/simulacion-hysys.png)

[Abrir el caso de Aspen HYSYS](<SIMULACIÓN/ANILINA_99.hsc>) · [Consultar tablas de corrientes](TUBERIAS)

### Diagramas de tuberías e instrumentación (P&ID)

El repositorio incluye entregables en PDF y DWG para los principales nodos del proceso:

| Subsistema | Documentos destacados |
| --- | --- |
| Almacenamiento y protección | [Tanque de nitrobenceno](<PID/PDF/TANQUE DE NITROBENCENO.pdf>) · [Tanque de hidrógeno](<PID/PDF/TANQUE DE HIDROGENO.pdf>) · [Blanketing](PID/PDF/BLANKETING.pdf) |
| Alimentación y reacción | [Compresor](PID/PDF/COMPRESOR.pdf) · [Mezclador MIX-102](<PID/PDF/MIXER 102.pdf>) · [Reactor enchaquetado](<PID/PDF/REACTOR ENCHAQUETADO.pdf>) |
| Enfriamiento y separación | [Separador V-101](PID/PDF/SEPARADOR001.pdf) · [Decantador V-100](<PID/PDF/DECANTADOR V100.pdf>) · [Decantador V-102](<PID/PDF/DECANTADOR V102.pdf>) |
| Purificación | [Columna T-100](<PID/PDF/Columna de destilacion T_100.pdf>) · [Columna T-101](<PID/PDF/Columna de destilacion T_101.pdf>) |
| Recuperación térmica | [Intercambiador de H₂](<PID/PDF/INTERCAMBIADOR DE H2.pdf>) · [Intercambiador de mezcla](<PID/PDF/INTERCAMBIADOR DE MEZCLA.pdf>) · [E-105](<PID/PDF/INTERCAMBIADOR DESPUES NITROBENCENO.pdf>) |
| Seguridad | [Antorcha](PID/PDF/TORCH.pdf) |

[Explorar todos los P&ID en PDF](PID/PDF) · [Explorar los archivos DWG](PID/DWG)

## Layout y diseño 3D

### Distribución conceptual por bloques

El layout se desarrolló con un enfoque **SLP (Systematic Layout Planning)**. La secuencia física sigue el flujo recepción → almacenamiento → reacción → separación → purificación → producto → despacho, mientras las áreas de mayor riesgo se mantienen segregadas.

![Distribución de la planta de anilina por bloques](<3D/LAYOUT/visualización en bloques LAYOUT.png>)

| Zonas | Función dentro del layout |
| --- | --- |
| 1-5 | Acceso, báscula, descarga y almacenamiento de nitrobenceno e hidrógeno |
| 6-12 | Preparación de alimentación, compresión, reacción, enfriamiento, separación y purificación |
| 13-15 | Almacenamiento de anilina, envasado, carga y despacho |
| 16-17 | Tratamiento de efluentes y antorcha |
| 18-20 | Servicios, mantenimiento, laboratorio, sala de control y administración |

### Vista isométrica realista

La representación isométrica convierte los bloques funcionales en una propuesta espacial con vialidades, racks de tuberías, diques de contención, áreas de carga, servicios, edificios y equipos principales.

![Layout isométrico realista de la planta](<3D/LAYOUT/visualisacion realista LAYOUT.png>)

### Recorrido en video

La imagen siguiente funciona como portada del recorrido. Selecciónala para abrir el archivo MP4 del modelo 3D.

[![Reproducir recorrido 3D de la planta de anilina](<3D/LAYOUT/visualisacion realista LAYOUT.png>)](<3D/VISUALIZACIÓN/GRABACIÓN 3D.mp4>)

▶ **[Reproducir o descargar la grabación 3D](<3D/VISUALIZACIÓN/GRABACIÓN 3D.mp4>)**

### Modelo Three.js interactivo

El archivo autónomo [3D/index.standalone.html](<3D/index.standalone.html>) contiene el modelo y la biblioteca necesaria en una sola página. Permite:

- orbitar, acercar y alejar la cámara;
- enfocar materias primas, reacción, separación, producto y servicios;
- activar o desactivar etiquetas y tuberías;
- usar giro automático;
- recorrer la planta en modo juego con `WASD`, ratón y `Shift`.

Para ejecutarlo, descarga el repositorio y abre el archivo HTML en un navegador moderno; no requiere instalación ni servidor local.

## Equipos principales

| Sección | Equipos o etiquetas representativas | Función |
| --- | --- | --- |
| Alimentación | T-01/T-02, MIX-103, MIX-101 | Almacenamiento, combinación de corrientes frescas y reciclos |
| Acondicionamiento | E-100, H-100, E-101, E-106 | Precalentamiento con servicios e integración térmica |
| Compresión | CO-100 | Elevar la presión de la mezcla reactiva |
| Reacción | CRV-100 | Conversión catalítica de nitrobenceno a anilina |
| Enfriamiento | E-101, E-103 | Recuperación de calor y condensación del efluente |
| Separación primaria | V-101 | Separación de H₂ y fase líquida; reciclo y purga |
| Decantación | V-100, V-102 | Separación de agua y recuperación de fase orgánica |
| Purificación | T-101, T-100, MIX-102 | Remoción de ligeros/agua y separación final al vacío |
| Seguridad y almacenamiento | Antorcha, tanques de producto, blanketing de N₂ | Manejo de purgas y conservación segura del producto |

Las hojas preliminares disponibles incluyen el análisis hidráulico de **T-101**, la especificación de la columna y archivos de diseño del intercambiador **E-105**. Véase [ESPECIFICACIÓNES DE EQUIPOS](<ESPECIFICACIÓNES DE EQUIPOS>).

## Seguridad y criterios de distribución

- **Hidrógeno:** almacenamiento segregado, control de fuentes de ignición, venteos y purgas dirigidos a un sistema seguro.
- **Nitrobenceno y anilina:** manejo en sistemas cerrados, contención secundaria, ventilación, detección de fugas y tratamiento de derrames/efluentes.
- **Reacción exotérmica:** control independiente de temperatura y presión, alarmas, interbloqueos, alivio y aislamiento de emergencia.
- **Antorcha:** ubicación periférica para recibir la purga de hidrógeno y otras descargas previstas por el diseño.
- **Tránsito y emergencia:** vialidad perimetral, accesos diferenciados, zonas de carga separadas y espacio para atención de emergencias.
- **Operación:** sala de control y laboratorio fuera del núcleo de proceso, con servicios y mantenimiento próximos pero físicamente diferenciados.

Estas medidas son criterios conceptuales; la selección final de distancias, protecciones, instrumentación y sistemas contra incendio requiere estudios formales de riesgo y cumplimiento de la normativa aplicable.

## Contenido del repositorio

| Recurso | Ubicación | Contenido |
| --- | --- | --- |
| Reporte completo | [REPORTE](REPORTE) | Documento técnico de 126 páginas en PDF |
| Documento editable | [WORD](WORD) | Versión DOCX del reporte |
| Simulación | [SIMULACIÓN](<SIMULACIÓN>) | Caso y respaldo de Aspen HYSYS |
| Diagramas de proceso | [DIAGRAMAS](DIAGRAMAS) | Bloques, flujo sin integración térmica y RIT |
| P&ID | [PID/PDF](PID/PDF) y [PID/DWG](PID/DWG) | Diagramas por equipo en formatos de consulta y edición |
| Diseño 3D | [3D](3D) | Modelo Three.js, layouts, memoria y grabación MP4 |
| Equipos | [ESPECIFICACIÓNES DE EQUIPOS](<ESPECIFICACIÓNES DE EQUIPOS>) | Hojas y análisis de equipos seleccionados |
| Tuberías y corrientes | [TUBERIAS](TUBERIAS) | Propiedades, composiciones, energía, diámetros y resumen |
| Costos de equipos | [COSTOS DE EQUIPOS](<COSTOS DE EQUIPOS>) | Estimación en Excel por equipo |
| Costos totales | [COSTOS TOTALES](<COSTOS TOTALES>) | Inversión y costo anual del proceso |
| Servicios auxiliares | [SERVICIOS DE LA PLANTA](<SERVICIOS DE LA PLANTA>) | Consumos y costos de servicios |

## Cómo explorar el proyecto

1. Comienza con el [reporte técnico completo](<REPORTE/ANILINA___EQUIPO 6.pdf>) para revisar bases, balances, localización, costos y referencias.
2. Revisa el [diagrama de bloques](<DIAGRAMAS/Bloques Anilina.pdf>) y la [RIT](DIAGRAMAS/RIT.jpg) para entender la lógica del proceso.
3. Abre [3D/index.standalone.html](<3D/index.standalone.html>) localmente para recorrer la distribución de planta.
4. Reproduce la [grabación 3D](<3D/VISUALIZACIÓN/GRABACIÓN 3D.mp4>) si deseas una visita guiada sin interactuar con el modelo.
5. Usa [SIMULACIÓN/ANILINA_99.hsc](<SIMULACIÓN/ANILINA_99.hsc>) en una instalación compatible de Aspen HYSYS para consultar o recalcular el caso.
6. Profundiza en los [P&ID](PID/PDF), las [tablas de tuberías](TUBERIAS) y los [libros de costos](<COSTOS TOTALES>).

## Alcance y limitaciones

El proyecto cubre selección de ruta, localización conceptual, descripción del proceso, simulación, diagramas, equipos principales, tuberías, servicios, costos, layout y representación 3D. No sustituye:

- ingeniería básica o de detalle certificada;
- validación experimental de cinética y catalizador;
- diseño mecánico completo y cálculo estructural;
- análisis dinámico, SIL, HAZOP, LOPA o QRA;
- permisos ambientales, uso de suelo o cumplimiento regulatorio;
- cotizaciones comerciales y evaluación financiera con precios actualizados.

## Contexto académico

| Campo | Información |
| --- | --- |
| Institución | Instituto Politécnico Nacional |
| Escuela | Escuela Superior de Ingeniería Química e Industrias Extractivas |
| Materia | Diseño de Plantas Industriales |
| Grupo | 5IM93 |
| Profesor | Gasca Reyes Luis Germán |
| Fecha de entrega | 27 de junio de 2026 |

### Integrantes

- Vázquez Pérez Diego
- Hernández González Mónica
- Esquivel Arriaga Isaac

---

Si este repositorio te resulta útil, consulta el reporte para conocer las bases de cálculo, supuestos y referencias que respaldan cada sección del diseño.
