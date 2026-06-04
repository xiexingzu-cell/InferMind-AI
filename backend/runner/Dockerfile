FROM python:3.11-slim

WORKDIR /runner

RUN sed -i 's/deb.debian.org/mirrors.tencent.com/g' /etc/apt/sources.list.d/debian.sources \
    && pip install --no-cache-dir -i https://pypi.tuna.tsinghua.edu.cn/simple \
        matplotlib==3.10.0 \
        numpy==2.2.2 \
        openpyxl==3.1.5 \
        pandas==2.2.3 \
        scikit-learn==1.6.1 \
        scipy==1.15.1 \
        seaborn==0.13.2

COPY run.py /runner/run.py

RUN useradd -m -u 1001 runner

USER runner
WORKDIR /workspace

CMD ["python", "/runner/run.py"]
